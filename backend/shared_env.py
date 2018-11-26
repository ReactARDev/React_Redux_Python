from settings import API_ENV, BUGSNAG_API_KEY
from os.path import dirname

if BUGSNAG_API_KEY and API_ENV is not "development":
    import bugsnag
    root_dir = dirname(__file__) + '/../'
    bugsnag.configure(api_key=BUGSNAG_API_KEY, project_root=root_dir)
    # from bugsnag.flask import handle_exceptions
