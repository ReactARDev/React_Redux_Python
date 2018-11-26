import json
import test_app
import factories
import pprint
from app import db_session_users
from schemas.base_users import User, UserAgency, UserFollowedEntity, MarketingCampaign, UserTopic, Subscription, UserFolder, AggregatedAnnotations

num_of_default_agencies_at_signup = 5
class RegisterTest(test_app.AppTest):
    def test_invite(self):
        emails = ['foo@example.com', 'foobarwat@example.com']
        for i, email in enumerate(emails):
            num_users = test_app.db_session_users.query(test_app.base_users.User)\
              .filter_by(email=email).count()
            self.assertEqual(0, num_users)

            # N.B. upper case the second example email in the initial invite request to simulate a scenario
            # where the user first sent it to us upper cased. the value remains otherwise lower case, so validation
            # below should all still work
            req_body = json.dumps({'email': email.upper() if i == 1 else email})
            resp = self.client.post(
                "/invite",
                headers={'Authorization': self.admin_user_token},
                data=req_body
            )

            self.assert200(resp)

            new_user = db_session_users.query(User).filter_by(email=email).first()
            self.assertFalse(new_user.enabled)

            reset_token = new_user.reset_token
            self.assertIsNotNone(reset_token)

            # don't allow a second submission
            resp = self.client.post(
                "/invite",
                headers={'Authorization': self.admin_user_token},
                data=req_body
            )
            self.assert400(resp)

            # fails for non-admin user
            resp = self.client.post(
                "/invite",
                headers={'Authorization': self.token},
                data=req_body
            )
            self.assert403(resp)

            # ...unless resend is true
            req_body = json.dumps({'email': email, 'resend': True})
            resp = self.client.post(
                "/invite",
                headers={'Authorization': self.admin_user_token},
                data=req_body
            )

            self.assert200(resp)
            self.assertIn('resent_invite_time', new_user.properties)
            self.assertNotEqual(reset_token, new_user.reset_token)

            req_body = json.dumps({
                "first_name": "First",
                "last_name": "Last",
                "email": email,
                "token": new_user.reset_token,
                "new_password": "somethingnew",
                "agencies": [80, 188],
                "other_agencies": "Something you didn't think of",
                "topics": [1, 2, 3],
                "other_topics": "Something else",
            })

            resp = self.client.post('/activate', data=req_body)

            self.assert200(resp)

            db_session_users.refresh(new_user)
            self.assertIsInstance(new_user.properties['activation_time'], unicode)

            self.assertTrue(new_user.enabled)

    def test_activation(self):
        user = factories.UserFactory.build(
            first_name=None,
            last_name=None,
        )
        user.reset_token = 'foo'
        orig_props = { 'property': 'exists', 'arrayprop': [1,2,3,4]}
        user.properties = orig_props
        user.enabled = False
        db_session_users.add(user)
        db_session_users.flush()
        db_session_users.refresh(user)

        initial_hash = user.password_hash

        req_body = json.dumps({
            "first_name": "First",
            "last_name": "Last",
            "email": user.email,
            "token": "foo",
            "new_password": "somethingnew",
            "agencies": [80, 188, 78987958795], # one invalid id
            # XXX these aren't really state agencies because they're not in the fixture:
            "state_agencies": ["US-CA", "US-NY"],
            "other_agencies": "Something you didn't think of",
            "other_state_agencies": "California dreams",
            "other_topics": "Something else",
            'is_contributor': True
        })

        resp = self.client.post('/activate', data=req_body)

        self.assert200(resp)

        new_user = db_session_users.query(User).filter_by(email=user.email).first()
        self.assertIsNone(new_user.reset_token)
        self.assertNotEqual(initial_hash, new_user.password_hash)
        self.assertEqual('First', new_user.first_name)
        self.assertEqual('Last', new_user.last_name)
        self.assertTrue(new_user.enabled)
        self.assertDictContainsSubset(orig_props, new_user.properties)
        self.assertTrue('contributor' in new_user.roles)

        subscription = db_session_users.query(Subscription).filter_by(user_id=user.id).first()
        self.assertEqual('free_trial', subscription.stripe_id)
        self.assertEqual(True, subscription.latest)
        self.assertEqual('active', subscription.status)

        folders = db_session_users.query(UserFolder).filter_by(user_id=user.id).all()
        bookmarked = filter(lambda folder : folder.name == 'Bookmarked', folders)
        read = filter(lambda folder : folder.name == 'Read', folders)
        self.assertIsInstance(folders, list)
        self.assertEqual(len(folders), 2)
        self.assertEqual(len(bookmarked), 1)
        self.assertEqual(len(read), 1)

        for p in ['other_topics', 'other_agencies', 'other_state_agencies']:
            self.assertIn(p, new_user.properties)
            self.assertIsInstance(new_user.properties.get(p), unicode)

        for p in ['agencies', 'state_agencies']:
            self.assertIn(p, new_user.properties)
            self.assertIsInstance(new_user.properties.get(p), list)

        num_user_agencies = db_session_users.query(UserAgency).filter_by(user_id=user.id).count()
        self.assertEqual(num_of_default_agencies_at_signup, num_user_agencies) # should not include invalid selection

        num_user_entities = db_session_users.query(UserFollowedEntity).filter_by(user_id=user.id).count()
        self.assertEqual(4, num_user_entities)

        num_news_entities = db_session_users.query(UserFollowedEntity).filter_by(user_id=user.id, entity_type='news_sources').count()
        self.assertEqual(2, num_news_entities)

        num_user_topics = db_session_users.query(UserTopic).filter_by(user_id=user.id).count()
        self.assertEqual(len(AggregatedAnnotations.topic_id_name_mapping.keys()), num_user_topics)

        # dry run should now fail
        req_body = json.dumps({
            'email': user.email,
            'token': 'does not matter',
            'dry_run': True,
        })

        resp = self.client.post('/activate', data=req_body)
        self.assert400(resp)
        self.assertRegexpMatches(resp.json['error'], r'enabled')


    def test_activation_with_edu_email(self):
        user = factories.UserFactory.build(
            first_name=None,
            last_name=None,
        )
        user.email = 'foo@hogwarts.edu'
        user.reset_token = 'foo'
        orig_props = { 'property': 'exists', 'arrayprop': [1,2,3,4]}
        user.properties = orig_props
        user.enabled = False
        db_session_users.add(user)
        db_session_users.flush()
        db_session_users.refresh(user)

        initial_hash = user.password_hash

        req_body = json.dumps({
            "first_name": "First",
            "last_name": "Last",
            "email": user.email,
            "token": "foo",
            "new_password": "somethingnew",
            "agencies": [80, 188, 78987958795], # one invalid id
            # XXX these aren't really state agencies because they're not in the fixture:
            "state_agencies": ["US-CA", "US-NY"],
            "other_agencies": "Something you didn't think of",
            "other_state_agencies": "California dreams",
            "other_topics": "Something else",
            'is_contributor': True
        })

        resp = self.client.post('/activate', data=req_body)
        self.assert200(resp)
        subscription = db_session_users.query(Subscription).filter_by(user_id=user.id).first()
        self.assertEqual('free_trial_120months', subscription.stripe_id)
        self.assertEqual(True, subscription.latest)
        self.assertEqual('active', subscription.status)


    def test_activation_dry_run(self):
        user = factories.UserFactory.build(
            first_name=None,
            last_name=None,
        )
        user.reset_token = 'bar'
        user.enabled = False
        db_session_users.add(user)
        db_session_users.flush()
        db_session_users.refresh(user)

        # try with a valid email/token first
        req_body = json.dumps({
            'email': user.email,
            'token': 'bar',
            'dry_run': True,
        })

        resp = self.client.post('/activate', data=req_body)
        self.assert200(resp)
        self.assertFalse(resp.json['marketing_campaign'])

        # invalid token

        req_body = json.dumps({
            'email': user.email,
            'token': 'baz',
            'dry_run': True,
        })

        resp = self.client.post('/activate', data=req_body)

        self.assert400(resp)

        # invalid email

        req_body = json.dumps({
            'email': 'invalid@example.com',
            'token': 'bar',
            'dry_run': True,
        })

        resp = self.client.post('/activate', data=req_body)

        self.assert400(resp)

        # missing email
        req_body = json.dumps({
            'email': None,
            'token': 'bar',
            'dry_run': True,
        })

        resp = self.client.post('/activate', data=req_body)

        self.assert400(resp)

    def test_activation_marketing_campaign(self):
        marketing_campaign = MarketingCampaign(name='foo', start_date="01/01/2017", end_date="01/05/2017", notes='bar', created_by_user_id=self.user.id)
        marketing_campaign.gen_token()
        db_session_users.add(marketing_campaign)
        db_session_users.commit()
        token = marketing_campaign.token

        # try with a valid email/token first
        req_body = json.dumps({
            'token': token,
            'dry_run': True,
        })

        resp = self.client.post('/activate', data=req_body)
        self.assert200(resp)
        self.assertTrue(resp.json['marketing_campaign'])

        signup_email = "email@marketing.campaign.com"

        req_body = json.dumps({
            "first_name": "First",
            "last_name": "Last",
            "email": signup_email,
            "token": token,
            "new_password": "somethingnew",
            "agencies": [80, 188, 78987958795], # one invalid id
            # XXX these aren't really state agencies because they're not in the fixture:
            "state_agencies": ["US-CA", "US-NY"],
            "other_agencies": "Something you didn't think of",
            "other_state_agencies": "California dreams",
            "topics": [1, 2, 3],
            "other_topics": "Something else",
        })

        resp = self.client.post('/activate', data=req_body)

        self.assert200(resp)
        self.assertIsInstance(resp.json['jwt_token'], unicode)
        new_user = db_session_users.query(User).filter_by(email=signup_email).first()
        self.assertIsInstance(new_user.reset_token, unicode)
        self.assertEqual('First', new_user.first_name)
        self.assertEqual('Last', new_user.last_name)
        self.assertFalse(new_user.enabled)
        self.assertIsInstance(new_user.password_hash, unicode)
        self.assertEqual(len(new_user.marketing_campaigns), 1)

        for p in ['other_topics', 'other_agencies', 'other_state_agencies']:
            self.assertIn(p, new_user.properties)
            self.assertIsInstance(new_user.properties.get(p), unicode)

        for p in ['agencies', 'state_agencies']:
            self.assertIn(p, new_user.properties)
            self.assertIsInstance(new_user.properties.get(p), list)

        num_user_agencies = db_session_users.query(UserAgency).filter_by(user_id=new_user.id).count()
        self.assertEqual(num_of_default_agencies_at_signup, num_user_agencies)  # should not include invalid selection

        num_user_entities = db_session_users.query(UserFollowedEntity).filter_by(user_id=new_user.id).count()
        self.assertEqual(4, num_user_entities)

        num_news_entities = db_session_users.query(UserFollowedEntity).filter_by(user_id=new_user.id, entity_type='news_sources').count()
        self.assertEqual(2, num_news_entities)

        num_user_topics = db_session_users.query(UserTopic).filter_by(user_id=new_user.id).count()
        self.assertEqual(3, num_user_topics)

        # validate access works with temporary token
        access_resp = self.client.get("/current_user", headers={'Authorization': resp.json['jwt_token']})
        self.assert200(access_resp)

        # run an extra api call that should fail on /activate with this email to confirm the token is not overwritten
        req_body = json.dumps({
            "email": signup_email,
            "new_password": "foo"
        })
        resp = self.client.post('/activate', data=req_body)
        self.assert400(resp)

        # finally, use the confirm route to enable the user
        req_body = json.dumps({
            "email": signup_email,
            "token": new_user.reset_token
        })
        resp = self.client.post('/confirm', data=req_body)

        new_user = db_session_users.query(User).filter_by(email=signup_email).first()
        self.assertTrue(new_user.enabled)
        self.assertIn('confirmed_date', new_user.properties)

    def test_activation_no_token(self):

        # try with a valid email/token first
        req_body = json.dumps({
            'dry_run': True,
        })

        resp = self.client.post('/activate', data=req_body)
        self.assert200(resp)
        self.assertFalse(resp.json['marketing_campaign'])

        signup_email = "email@no.token.com"

        req_body = json.dumps({
            "first_name": "First",
            "last_name": "Last",
            "email": signup_email,
            "new_password": "somethingnew",
            "agencies": [80, 188, 78987958795],  # one invalid id
            # XXX these aren't really state agencies because they're not in the fixture:
            "state_agencies": ["US-CA", "US-NY"],
            "other_agencies": "Something you didn't think of",
            "other_state_agencies": "California dreams",
            "topics": [1, 2, 3],
            "other_topics": "Something else",
        })

        resp = self.client.post('/activate', data=req_body)

        self.assert200(resp)
        self.assertIsInstance(resp.json['jwt_token'], unicode)
        new_user = db_session_users.query(User).filter_by(email=signup_email).first()
        self.assertIsInstance(new_user.reset_token, unicode)
        self.assertEqual('First', new_user.first_name)
        self.assertEqual('Last', new_user.last_name)
        self.assertFalse(new_user.enabled)
        self.assertIsInstance(new_user.password_hash, unicode)
        self.assertEqual(len(new_user.marketing_campaigns), 0)

        for p in ['other_topics', 'other_agencies', 'other_state_agencies']:
            self.assertIn(p, new_user.properties)
            self.assertIsInstance(new_user.properties.get(p), unicode)

        for p in ['agencies', 'state_agencies']:
            self.assertIn(p, new_user.properties)
            self.assertIsInstance(new_user.properties.get(p), list)

        num_user_agencies = db_session_users.query(UserAgency).filter_by(user_id=new_user.id).count()
        self.assertEqual(num_of_default_agencies_at_signup, num_user_agencies)  # should not include invalid selection

        num_user_entities = db_session_users.query(UserFollowedEntity).filter_by(user_id=new_user.id).count()
        self.assertEqual(4, num_user_entities)

        num_news_entities = db_session_users.query(UserFollowedEntity).filter_by(user_id=new_user.id, entity_type='news_sources').count()
        self.assertEqual(2, num_news_entities)

        num_user_topics = db_session_users.query(UserTopic).filter_by(user_id=new_user.id).count()
        self.assertEqual(3, num_user_topics)

        # validate access works with temporary token
        access_resp = self.client.get("/current_user", headers={'Authorization': resp.json['jwt_token']})
        self.assert200(access_resp)

        # run an extra api call that should fail on /activate with this email to confirm the token is not overwritten
        req_body = json.dumps({
            "email": signup_email,
            "new_password": "foo"
        })
        resp = self.client.post('/activate', data=req_body)
        self.assert400(resp)

        # finally, use the confirm route to enable the user
        req_body = json.dumps({
            "email": signup_email,
            "token": new_user.reset_token
        })
        resp = self.client.post('/confirm', data=req_body)
        self.assert200(resp)
        new_user = db_session_users.query(User).filter_by(email=signup_email).first()
        self.assertTrue(new_user.enabled)
        self.assertIn('confirmed_date', new_user.properties)

        resp = self.client.post('/confirm', data=req_body)
        self.assert400(resp)

    def test_invite_mixed(self):
        emails = ['foobar1@example.com', 'foobarwat1@example.com']
        for i, email in enumerate(emails):
            num_users = test_app.db_session_users.query(test_app.base_users.User)\
              .filter_by(email=email).count()
            self.assertEqual(0, num_users)

            # N.B. upper case the second example email in the initial invite request to simulate a scenario
            # where the user first sent it to us upper cased. the value remains otherwise lower case, so validation
            # below should all still work
            req_body = json.dumps({'email': email.upper() if i == 1 else email})
            resp = self.client.post(
                "/invite",
                headers={'Authorization': self.admin_user_token},
                data=req_body
            )

            self.assert200(resp)

            new_user = db_session_users.query(User).filter_by(email=email).first()
            self.assertFalse(new_user.enabled)

            reset_token = new_user.reset_token
            self.assertIsNotNone(reset_token)

            # don't allow a second submission
            resp = self.client.post(
                "/invite",
                headers={'Authorization': self.admin_user_token},
                data=req_body
            )
            self.assert400(resp)

            # fails for non-admin user
            resp = self.client.post(
                "/invite",
                headers={'Authorization': self.token},
                data=req_body
            )
            self.assert403(resp)

            # ...unless resend is true
            req_body = json.dumps({'email': email, 'resend': True})
            resp = self.client.post(
                "/invite",
                headers={'Authorization': self.admin_user_token},
                data=req_body
            )

            self.assert200(resp)
            self.assertNotEqual(reset_token, new_user.reset_token)

            req_body = json.dumps({
                "first_name": "First",
                "last_name": "Last",
                "email": email,
                "new_password": "somethingnew",
                "agencies": [80, 188],
                "other_agencies": "Something you didn't think of",
                "other_state_agencies": "California dreams",
                "topics": [1, 2, 3],
                "other_topics": "Something else",
                "state_agencies": ["US-CA", "US-NY"],
            })

            resp = self.client.post('/activate', data=req_body)

            self.assert200(resp)

            db_session_users.refresh(new_user)
            self.assertIsInstance(new_user.properties['activation_time'], unicode)

            self.assertFalse(new_user.enabled)
            self.assertIsInstance(resp.json['jwt_token'], unicode)
            self.assertIsInstance(new_user.reset_token, unicode)
            self.assertEqual('First', new_user.first_name)
            self.assertEqual('Last', new_user.last_name)
            self.assertFalse(new_user.enabled)
            self.assertIsInstance(new_user.password_hash, unicode)
            self.assertEqual(len(new_user.marketing_campaigns), 0)

            for p in ['other_topics', 'other_agencies', 'other_state_agencies']:
                self.assertIn(p, new_user.properties)
                self.assertIsInstance(new_user.properties.get(p), unicode)

            for p in ['agencies', 'state_agencies']:
                self.assertIn(p, new_user.properties)
                self.assertIsInstance(new_user.properties.get(p), list)


            num_user_agencies = db_session_users.query(UserAgency).filter_by(user_id=new_user.id).count()
            self.assertEqual(num_of_default_agencies_at_signup, num_user_agencies)  # should not include invalid selection

            num_user_entities = db_session_users.query(UserFollowedEntity).filter_by(user_id=new_user.id).count()
            self.assertEqual(4, num_user_entities)

            num_news_entities = db_session_users.query(UserFollowedEntity).filter_by(user_id=new_user.id, entity_type='news_sources').count()
            self.assertEqual(2, num_news_entities)

            num_user_topics = db_session_users.query(UserTopic).filter_by(user_id=new_user.id).count()
            self.assertEqual(3, num_user_topics)

            # validate access works with temporary token
            access_resp = self.client.get("/current_user", headers={'Authorization': resp.json['jwt_token']})
            self.assert200(access_resp)

            # run an extra api call that should fail on /activate with this email to confirm the token is not overwritten
            req_body = json.dumps({
                "email": email,
                "new_password": "foo"
            })
            resp = self.client.post('/activate', data=req_body)
            self.assert400(resp)

            # finally, use the confirm route to enable the user
            req_body = json.dumps({
                "email": email,
                "token": new_user.reset_token
            })
            resp = self.client.post('/confirm', data=req_body)
            self.assert200(resp)
            new_user = db_session_users.query(User).filter_by(email=email).first()
            self.assertTrue(new_user.enabled)
            self.assertIn('confirmed_date', new_user.properties)

            resp = self.client.post('/confirm', data=req_body)
            self.assert400(resp)


    def test_check_email(self):
        resp = self.client.get("/check_email?email=demo@jurispect.com")
        self.assert200(resp)
        self.assertIn('email_in_use', resp.json)
        self.assertIsInstance(resp.json['email_in_use'], bool)

    def test_resend_confirmation_email(self):
        # first create a user that has signed up (not invited) and requires a confirmation
        req_body = json.dumps({
            "first_name": "First",
            "last_name": "Last",
            "email": 'a@example.com',
            "token": None,
            "new_password": "somethingnew",
            "agencies": [80, 188],
            "other_agencies": "Something you didn't think of",
            "topics": [1, 2, 3],
            "other_topics": "Something else",
        })

        resp = self.client.post('/activate', data=req_body)

        self.assert200(resp)

        user = db_session_users.query(User).filter_by(email='a@example.com').first()
        db_session_users.refresh(user)

        # Now that the user is created lets resend them a confirmation email
        req_body = json.dumps({'email': user.email })

        resp = self.client.post(
            "/send_confirm_email",
            headers={'Authorization': self.token},
            data=req_body
        )

        self.assert200(resp)
        self.assertIn('confirmation_resent_time', user.properties)


        # Now lets test if we get the error we expect
        req_body = json.dumps({})

        resp = self.client.post(
            "/send_confirm_email",
            headers={'Authorization': self.token},
            data=req_body
        )

        self.assert400(resp)

        #now lets send a false email
        req_body = json.dumps({'email': 'blah@blah.com'})

        resp = self.client.post(
            "/send_confirm_email",
            headers={'Authorization': self.token},
            data=req_body
        )

        self.assert400(resp)
