from models import *
import datetime as dt

# production user_ids
# sixfifteen = [ 169, 174, 175, 199, 184, 196, 170, 167, 195, 131, 127, 140, 178, 177, 194, 176, 134, 185, 186, 141, 238,  145, 230, 232, 308, 245, 173, 236, 286, 233, 200 ]
# sevenseven = [ 518, 519, 521, 524, 531, 498, 246, 476, 522, 491, 527, 534, 480, 546, 520, 495, 479, 156, 155, 158, 153, 154, 157, 152, 243, 472, 547, 526, 517, 496, 540, 515, 499, 473, 497, 492, 543, 556, 470, 529, 493, 505, 309, 310, 481, 494, 135, 231, 242, 301, 234, 209, 115, 265, 266, 136, 267, 268, 269, 270, 271, 272, 172, 206, 273, 274, 275, 83, 139, 204, 133, 171, 138, 137, 101, 142, 237, 240, 241,  144, 244, 525, 260, 278, 249, 507, 143 ]
# sevenfifteen = [ 560, 561, 477, 564, 573, 574, 575, 559, 211, 212, 565, 203 ]

# integration user_ids
# sixfifteen = [271,157, 132]
# sevenseven = [10, 280, 411]
# sevenfifteen = [ 121, 278, 437]

def change_subscription_created_at(user_ids, new_date):
    for user_id in user_ids:
        user = db_session_users.query(User).filter_by(id=user_id).first()
        if user is not None:
            subscription = db_session_users.query(Subscription).filter_by(user_id=user_id, active=True, payment_type=None).first()
            if subscription is not None:
                subscription.created_at = new_date
                db_session_users.add(subscription)
                db_session_users.commit()

change_subscription_created_at(sixfifteen, dt.datetime(2017, 6, 15, 1, 0, 0, 123456))
change_subscription_created_at(sevenseven, dt.datetime(2017, 7, 7, 1, 0, 0, 123456))
change_subscription_created_at(sevenfifteen, dt.datetime(2017, 7, 15, 1, 0, 0, 123456))
