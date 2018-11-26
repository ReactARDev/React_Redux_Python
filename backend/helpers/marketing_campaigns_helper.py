from flask import jsonify
from helpers.utilities import merge_two_dicts
from models import db_session_users, MarketingCampaign, MarketingCampaignUsers

def get_all_marketing_campaigns():
    return {"marketing_campaigns": [m.to_dict() for m in db_session_users.query(MarketingCampaign)]}

def create_marketing_campaign(user_id, params):
    marketing_campaign = MarketingCampaign(merge_two_dicts(params, {'created_by_user_id': user_id}))
    marketing_campaign.gen_token()
    db_session_users.add(marketing_campaign)
    db_session_users.commit()
    db_session_users.refresh(marketing_campaign)
    return {"marketing_campaign": marketing_campaign.to_dict()}

def update_marketing_campaign(marketing_campaign_id, params):
    marketing_campaign = db_session_users.query(MarketingCampaign).filter_by(id=marketing_campaign_id).first()

    if 'start_date' in params:
        marketing_campaign.start_date = params['start_date']

    if 'end_date' in params:
        marketing_campaign.end_date = params['end_date']

    if 'name' in params:
        marketing_campaign.name = params['name']

    if 'notes' in params:
        marketing_campaign.notes = params['notes']

    # n.b. for regenerating the token
    if 'token' in params:
        marketing_campaign.gen_token()

    db_session_users.add(marketing_campaign)
    db_session_users.commit()
    db_session_users.refresh(marketing_campaign)
    return {"marketing_campaign": marketing_campaign.to_dict()}

def get_marketing_campaign_details(marketing_campaign_id):
    marketing_campaign = db_session_users.query(MarketingCampaign).filter_by(id=marketing_campaign_id).first()
    marketing_campaign_details = marketing_campaign.to_dict()
    marketing_campaign_details['users'] = [u.to_dict() for u in marketing_campaign.users]
    return {"marketing_campaign": marketing_campaign_details}






