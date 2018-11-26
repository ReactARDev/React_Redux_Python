import json
import test_app
from schemas.base_users import Plan, Subscription, User
from test_app import db_session_users
import datetime

class PaymentsTest(test_app.AppTest):
    start_date = '2017-09-20 20:40:25.836603'
    end_date = '2017-09-20 20:40:25.836603'
    expiration_date = '2017-09-20 20:40:25.836603'
    def before_each(self):
        db_session_users.query(Subscription).delete()
        self.subscriptions = [
            Subscription({
                'stripe_id': 'sub_BJJGmBDQP5Nblr',
                'user_id': self.user.id,
                'plan_id': 4,
                'payment_type': 'stripe',
                'start_date': self.start_date,
                'latest': True,
                'status': 'active',
                'expiration_date': self.expiration_date
            }),
            Subscription({
                'stripe_id': 'free_trial',
                'user_id': self.user.id,
                'plan_id': 1,
                'latest': False,
                'start_date': self.start_date,
                'end_date': self.end_date,
                'modified_by_user_id': 1,
                'status': 'active',
                'expiration_date': self.expiration_date
            })

        ]
        db_session_users.add_all(self.subscriptions)
        db_session_users.commit()

    def test_get_subscriptions(self):
        self.before_each()
        response = self.client.get("/subscriptions", headers={'Authorization': self.token})
        self.assert200(response)
        self.assertIn("subscriptions", response.json)
        self.assertIsInstance(response.json["subscriptions"], list)
        self.assertEqual(len(response.json["subscriptions"]), 2)
        self.assertEqual(response.json["subscriptions"][0]['stripe_id'], "free_trial")
        self.assertEqual(response.json["subscriptions"][0]['latest'], False)
        self.assertIsInstance(response.json["subscriptions"][0]['created_at'], basestring)
        self.assertEqual(response.json["subscriptions"][0]['name'], 'Free Trial - 1 month')
        self.assertEqual(response.json["subscriptions"][0]['category'], 'free_trial')
        self.assertEqual(response.json["subscriptions"][0]['price'], 0)
        self.assertEqual(response.json["subscriptions"][0]['price_period'], 1)
        self.assertEqual(response.json["subscriptions"][0]['status'], 'active')
        self.assertIsInstance(response.json["subscriptions"][0]['expiration_date'], basestring)
        self.assertIsInstance(response.json["subscriptions"][0]['start_date'], basestring)
        self.assertIsInstance(response.json["subscriptions"][0]['end_date'], basestring)

        self.assertEqual(response.json["subscriptions"][1]['stripe_id'], "pro_monthly_recur")
        self.assertEqual(response.json["subscriptions"][1]['latest'], True)
        self.assertIsInstance(response.json["subscriptions"][1]['created_at'], basestring)
        self.assertEqual(response.json["subscriptions"][1]['name'], 'Professional Monthly Recurring')
        self.assertEqual(response.json["subscriptions"][1]['category'], 'paid')
        self.assertEqual(response.json["subscriptions"][1]['price'], 99)
        self.assertEqual(response.json["subscriptions"][1]['price_period'], 1)
        self.assertIsInstance(response.json["subscriptions"][1]['next_bill_date'], int)
        self.assertIsInstance(response.json["subscriptions"][0]['expiration_date'], basestring)
        self.assertEqual(response.json["subscriptions"][0]['status'], 'active')
        self.assertIsInstance(response.json["subscriptions"][0]['start_date'], basestring)


    def test_subscribe_bad_plan(self):
        request_body = json.dumps({
            'plan': 'money_for_life',
            'payment_type': 'stripe',
            'stripe_response': {'id': '123456'}
        })
        response = self.client.post("/subscriptions", headers={'Authorization': self.token}, data=request_body)
        self.assertStatus(response, 409)
        self.assertEqual(response.json['errors'], 'Your subscription purchase was not successful and your card was not charged. Please refresh the page and enter your payment details again or contact your bank. You can also reach out to us for help at billing@compliance.ai.')

    def test_subscribe_but_already_subscribed(self):
        self.before_each()
        request_body = json.dumps({
            'plan': 'pro_monthly_recur',
            'payment_type': 'stripe',
            'stripe_response': {'id': '123456'}
        })
        response = self.client.post("/subscriptions", headers={'Authorization': self.token}, data=request_body)
        self.assertStatus(response, 409)
        self.assertEqual(response.json['errors'], 'You already have a subscription. Please reach out to us for help at billing@compliance.ai.')

    def test_get_all_subscriptions(self):
        self.before_each()

        response = self.client.get("/subscriptions/all", headers={'Authorization': self.admin_user_token})
        self.assert200(response)
        self.assertIn("all_subscriptions", response.json)
        self.assertIsInstance(response.json["all_subscriptions"], list)
        self.assertEqual(len(response.json["all_subscriptions"]), 1)

        subscription = response.json["all_subscriptions"][0]

        self.assertEqual(subscription["user_id"], self.user.id)
        self.assertEqual(subscription["plan_id"], 4)
        self.assertEqual(subscription["payment_type"], "stripe")

        expected_user = db_session_users.query(User).filter_by(id=subscription['user_id']).first()
        expected_plan = db_session_users.query(Plan).filter_by(id=subscription['plan_id']).first()

        self.assertEqual(subscription["first_name"], expected_user.first_name)
        self.assertEqual(subscription["last_name"], expected_user.last_name)
        self.assertEqual(subscription["email"], expected_user.email)
        self.assertEqual(subscription["roles"], expected_user.roles)
        self.assertEqual(subscription["plan_name"], expected_plan.name)

        # add one more subscription
        new_subscription = Subscription(
            {
                'stripe_id': 'free_trial',
                'user_id': self.qa_user.id,
                'plan_id': 1,
                'latest': True
            })

        db_session_users.add(new_subscription)
        db_session_users.commit()

        response = self.client.get("/subscriptions/all", headers={'Authorization': self.admin_user_token})

        self.assert200(response)
        self.assertIn("all_subscriptions", response.json)
        self.assertIsInstance(response.json["all_subscriptions"], list)
        self.assertEqual(len(response.json["all_subscriptions"]), 2)

    def test_expire_subscription(self):
        self.before_each()
        today = datetime.datetime.utcnow()
        new_exp_date = str(today.date())
        notes = 'User suspended due to inactivity'
        request_body = json.dumps({
            'expiration_date': new_exp_date,
            'notes': notes
        })
        response = self.client.post("/subscriptions/"+str(self.subscriptions[0].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("new_subscription", response.json)
        self.assertIsInstance(response.json["new_subscription"], dict)
        result_subscription = response.json["new_subscription"]
        self.assertEqual(result_subscription['status'], Subscription.INACTIVE_STATUS)
        self.assertEqual(result_subscription['status_reason'], Subscription.EXPIRED_STATUS_REASON)
        self.assertEqual(result_subscription['notes'], notes)

        res_date = datetime.datetime.strptime(str(result_subscription['expiration_date']), "%a, %d %b %Y %H:%M:%S %Z")
        self.assertEqual(res_date.date(), today.date())

    def test_extend_exp_date_for_inactive_subscription(self):
        self.before_each()
        s1 = self.subscriptions [0]
        s1.status = Subscription.INACTIVE_STATUS
        db_session_users.add(s1)
        db_session_users.commit()

        date_in_future = datetime.datetime.utcnow() + datetime.timedelta(days=20)
        new_exp_date = date_in_future.date()
        request_body = json.dumps({
            'expiration_date': str(new_exp_date),
        })
        response = self.client.post("/subscriptions/"+str(self.subscriptions[0].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("new_subscription", response.json)
        self.assertIsInstance(response.json["new_subscription"], dict)
        result_subscription = response.json["new_subscription"]
        self.assertEqual(result_subscription['status'], Subscription.ACTIVE_STATUS)
        self.assertEqual(result_subscription['status_reason'], Subscription.REACTIVATED_STATUS_REASON)

        res_date = datetime.datetime.strptime(str(result_subscription['expiration_date']), "%a, %d %b %Y %H:%M:%S %Z")
        self.assertEqual(res_date.date(), date_in_future.date())

    def test_update_subscription(self):
        self.before_each()

        date_in_future = datetime.datetime.utcnow() + datetime.timedelta(days=20)
        new_exp_date = date_in_future.date()
        payment_type = 'invoice'

        request_body = json.dumps({
            'expiration_date': str(new_exp_date),
            'payment_type': payment_type,
        })
        response = self.client.post("/subscriptions/"+str(self.subscriptions[0].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("new_subscription", response.json)
        self.assertIsInstance(response.json["new_subscription"], dict)
        result_subscription = response.json["new_subscription"]
        self.assertEqual(result_subscription['status'], Subscription.ACTIVE_STATUS)
        res_date = datetime.datetime.strptime(str(result_subscription['expiration_date']), "%a, %d %b %Y %H:%M:%S %Z")
        self.assertEqual(res_date.date(), date_in_future.date())
        self.assertEqual(result_subscription['payment_type'], payment_type)


    def test_update_plan_for_inactive_subscription(self):
        self.before_each()
        s1 = self.subscriptions [0]
        s1.status = Subscription.INACTIVE_STATUS
        s1.status_reason = Subscription.EXPIRED_STATUS_REASON
        s1.notes = 'User suspended due to inactivity'
        db_session_users.add(s1)
        db_session_users.commit()

        # non recurring plan
        plan_id = 1

        request_body = json.dumps({
            'plan_id': plan_id
        })
        response = self.client.post("/subscriptions/"+str(self.subscriptions[0].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("new_subscription", response.json)
        self.assertIsInstance(response.json["new_subscription"], dict)
        result_subscription = response.json["new_subscription"]
        self.assertEqual(result_subscription["plan_id"], plan_id)
        plan = db_session_users().query(Plan).filter_by(id=plan_id).first()
        self.assertEqual(result_subscription["stripe_id"], plan.stripe_id)
        self.assertEqual(result_subscription['status'], Subscription.ACTIVE_STATUS)
        self.assertEqual(result_subscription['status_reason'], Subscription.REACTIVATED_STATUS_REASON)
        self.assertIsNone(result_subscription['notes']);
        self.assertIsNotNone(result_subscription['expiration_date'])

    def test_update_plan_to_recurring_plan(self):
        self.before_each()
        s1 = self.subscriptions [0]
        s1.plan_id = 1
        s1.expiration_date = datetime.datetime.utcnow()
        db_session_users.add(s1)
        db_session_users.commit()

        # recurring plan
        plan_id = 4

        request_body = json.dumps({
            'plan_id': plan_id
        })
        response = self.client.post("/subscriptions/"+str(self.subscriptions[0].id), headers={'Authorization': self.admin_user_token}, data=request_body)
        self.assert200(response)
        self.assertIn("new_subscription", response.json)
        self.assertIsInstance(response.json["new_subscription"], dict)
        result_subscription = response.json["new_subscription"]
        self.assertEqual(result_subscription["plan_id"], plan_id)
        plan = db_session_users().query(Plan).filter_by(id=plan_id).first()
        self.assertEqual(result_subscription["stripe_id"], plan.stripe_id)
        self.assertEqual(result_subscription['status'], Subscription.ACTIVE_STATUS)
        self.assertEqual(result_subscription['status_reason'], Subscription.REACTIVATED_STATUS_REASON)
        self.assertIsNone(result_subscription['expiration_date'])
