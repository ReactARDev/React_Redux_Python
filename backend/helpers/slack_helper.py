import requests
import json

SLACK_NOTICE_HOOK_URL = 'https://hooks.slack.com/services/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'

def post_email_notice_to_slack(text):
    data = {
        "text": text
    }
    requests.post(SLACK_NOTICE_HOOK_URL, data=json.dumps(data))
