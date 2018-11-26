from smtpd import DebuggingServer
import asyncore

# this is a simple script to test SMTP capabilites. It will listen on
# port 2525 and print the contents of any messages it receives.

d=DebuggingServer(('127.0.0.1', 2525), None)

asyncore.loop()
