def add_plan(plan_id, plan_name, plan_category, stripe_id, price, stripe_price, price_period, recurring):
    new_plan = {
            "id": plan_id,
            "name": plan_name,
            "category": plan_category,
            "stripe_id": stripe_id,
            "price": price,
            "stripe_price": stripe_price,
            "price_period": price_period,
            "recurring": recurring
        }

    db_session_users.add(new_plan)
    db_session_users.commit()

add_plan(10, "Team - 12 month", "team", "team_annual_recur", 0, 0, 12, True)
add_plan(10, "Team - 1 month", "team", "team_monthly_recur", 0, 0, 1, True)

from models import *
db_session_users.add(Plan({
    'stripe_id': 'pro_monthly_oct_2017',
    'name': 'Professional Monthly Recurring Oct 2017',
    'category': 'paid',
    'price': 249,
    'stripe_price': 24900,
    'price_period': 1,
    'recurring': True
}))
db_session_users.add(Plan({
    'stripe_id': 'pro_annual_new_oct_2017',
    'name': 'Professional Annual Recurring Oct 2017',
    'category': 'paid',
    'price': 2388,
    'stripe_price': 238800,
    'price_period': 12,
    'recurring': True
}))
db_session_users.commit()
