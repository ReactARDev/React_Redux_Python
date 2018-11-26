import smtplib
import email
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from jinja2 import Environment, FileSystemLoader
import pprint
import os
import sys
import socks
import re
import mandrill
from settings import SMTP_HOST, SMTP_PORT, SMTP_SSL, SMTP_TLS, PROXIMO_URL, REGISTRATION_DOMAINS, SMTP_LOGIN, SMTP_PASSWORD, MANDRILL_API_KEY
from helpers.slack_helper import post_email_notice_to_slack

class EmailHelper(object):
    def __init__(self):
        self.host = SMTP_HOST
        self.port = SMTP_PORT
        self.ssl = True if (SMTP_SSL is not None and int(SMTP_SSL) == 1) else False
        self.tls = True if (SMTP_TLS is not None and int(SMTP_TLS) == 1) else False

        if PROXIMO_URL:
            # ex: http://proxy:48aa22ee7d67-4d6d-957f-82b96aaf0648@proxy-23-21-132-4.proximo.io
            # need to parse manually because urllib doesn't extract the username/password correctly
            proxy_parts = re.match('(\w+)://(\w+):([\w-]+)@(.+)', PROXIMO_URL).groups()
            proxy_username = proxy_parts[1]
            proxy_password = proxy_parts[2]
            proxy_host = proxy_parts[3]
            proxy_port = 1080
            socks.setdefaultproxy(
                socks.PROXY_TYPE_SOCKS5,
                proxy_host,
                proxy_port,
                username=proxy_username,
                password=proxy_password
            )
            socks.wrapmodule(smtplib)

        template_path = os.path.join(os.path.dirname(__file__), '../templates/email/')

        self.jinja_env = Environment(loader=FileSystemLoader(template_path), extensions=['jinja2.ext.loopcontrols'])

        # XXX reuse connection

    @staticmethod
    def validate_email(email):
        if REGISTRATION_DOMAINS == '*':
            return True

        allowed_domain = False
        user_domain_match = re.search('@(.+)', email)

        # check if the email belongs to a whitelisted domain
        if REGISTRATION_DOMAINS and user_domain_match is not None:
            user_domain = user_domain_match.groups()[0]

        for domain in re.split(',', REGISTRATION_DOMAINS):
            if len(domain.strip()) > 0 and domain.strip() == user_domain:
                allowed_domain = True
                break

        return allowed_domain

    def send_via_mandrill(self, recipients, from_addr, from_name, subject, template=None, vars={}):
        if template is not None:
            template_obj_text = self.jinja_env.get_template(template + '.txt')
            template_obj_html = self.jinja_env.get_template(template + '.html')
            text = template_obj_text.render(vars).encode('utf-8')
            html = template_obj_html.render(vars).encode('utf-8')
        elif not text:
            raise TypeError('text or template must be specified')

        html_str = str(html)
        txt_str = str(text)
        # see for more details -> https://complianceai.atlassian.net/wiki/spaces/AT/pages/11239446/Mandrill+Research+Findings
        message = {
         'auto_html': None,
         'auto_text': None,
         'from_email': from_addr,
         'from_name': from_name,
         'html': html_str,
         'important': False,
         'inline_css': None,
         'preserve_recipients': True,
         'return_path_domain': from_addr,
         'signing_domain': 'compliance.ai',
         'subject': subject,
         'text': txt_str,
         'to': recipients,
         'track_clicks': True,
         'track_opens': True,
         'url_strip_qs': True,
         'view_content_link': True
        }

        try:
            mandrill_client = mandrill.Mandrill(MANDRILL_API_KEY)
            result = mandrill_client.messages.send(message=message, async=False, ip_pool='Main Pool')
        except:
            if (mandrill.Error):
                # Mandrill errors are thrown as exceptions
                print 'A mandrill error occurred: %s - %s' % (mandrill.Error.__class__, mandrill.Error)
                post_email_notice_to_slack('Error sending agency summary email to '+ recipients)

    def send_email(self, to_addr, from_addr, subject, text=None, template=None, html=False, readable_output=True, vars={}):
        # XXX multiple to addresses
        if template is not None:
            template_obj_text = self.jinja_env.get_template(template + '.txt')
            template_obj_html = self.jinja_env.get_template(template + '.html')
            text = template_obj_text.render(vars).encode('utf-8')
            html = template_obj_html.render(vars).encode('utf-8')
        elif not text:
            raise TypeError('text or template must be specified')

        msg = MIMEMultipart('alternative')

        cs=email.charset.Charset('utf-8')
        cs.body_encoding = email.charset.QP
        cs.header_encoding = email.charset.QP
        msg.set_charset(cs)

        msg.set_unixfrom('Jurispect')
        msg['To'] = to_addr # XXX include full name
        msg['From'] = from_addr
        msg['Subject'] = subject

        text_msg = MIMEText(None, 'plain')
        html_msg = MIMEText(None, 'html')
        text_msg.replace_header('content-transfer-encoding', 'quoted-printable')
        html_msg.replace_header('content-transfer-encoding', 'quoted-printable')
        text_msg.set_payload(text.encode('quoted-printable'), 'utf-8')
        html_msg.set_payload(html.encode('quoted-printable'), 'utf-8')

        msg.attach(text_msg)
        msg.attach(html_msg)

        # this is the dumbest thing I've ever seen, but we need to
        # switch from LF to CRLF this is necessary to get
        # quoted-printable to work in worthless fucking outlook:

        msg_crlf = re.sub(r'(?<!\r)\n', '\r\n', msg.as_string())

        # if SMTP_HOST is not set, print the contents to stdout instead
        # this will prevent emails from being sent on dev and test
        if self.host is None:
            sys.stderr.write("Email contents (SMTP_HOST is not set):\n")
            if readable_output:
                sys.stdout.write(msg_crlf.decode('quoted-printable'))
            else:
                sys.stdout.write(msg_crlf)
            return

        # Wrapping email sends in a for loop for 10 retries
        success = False
        for i in range(1, 11):
            try:
                if self.ssl:
                    server = smtplib.SMTP_SSL(self.host, self.port)
                else:
                    server = smtplib.SMTP(self.host, self.port)

                # initiate connection (say hello)
                server.ehlo()

                # if TLS is enabled, issue the command to switch to STARTTLS
                # mode, then say hello again on the encrypted side
                # source: http://www.mkyong.com/python/how-do-send-email-in-python-via-smtplib/
                if self.tls:
                    server.starttls()
                    server.ehlo()

                server.set_debuglevel(1)
                server.login(SMTP_LOGIN, SMTP_PASSWORD)
                send_resp = server.sendmail(from_addr, to_addr, msg_crlf)
                server.quit()

                #n.b. break the loop here when no exception (i.e. success)
                success = True
                break
            except:
                print("Email failure on try number: " + str(i) + " out of 10")

        if not success:
            print("Failed to send email to: " + to_addr + " for " + subject)
