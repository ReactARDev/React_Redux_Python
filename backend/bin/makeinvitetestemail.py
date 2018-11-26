import os
import sys

this_folder = os.path.dirname(os.path.realpath(__file__))
sys.path.append(this_folder + '/../')

from helpers.emailhelper import EmailHelper
import urllib

"""

Generate a sample invite email for layout testing

python bin/maketestemail.py > test.eml

"""

email_helper = EmailHelper()

template = 'invite-inline'
subject = 'Welcome to Compliance.ai!'
base_url = 'http://example.com'
email = 'test@example.com'

activate_url = '%s/activate?email=%s&token=%s' % (
    base_url,
    urllib.quote_plus(email),
    urllib.quote_plus('$2b$10$.gjXMdl8WgLBUgRahn8GJO5RlVF18ivb75jEoGB8p9LrJrl0ERW2G')
)

template_vars = {
    'url': activate_url,
    'email': email,
}

email_helper.send_email(
    email,
    'noreply@compliance.ai',
    subject,
    template=template,
    readable_output=False,
    vars=template_vars,
)
