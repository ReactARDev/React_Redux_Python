# Quick Start
## Read LOCAL_SETUP for environment-specific recommandations.

## Prerequisites


* Python 2.7
* Virtualenv
* PostgreSQL 9.4
* Elasticsearch 5.4.3

## Virtualenv setup

In the repository directory, create a virtualenv with `virtualenv env`
Make sure when running any other command in the repository from here on out, you have sourced this env.
Recommend adding `cd jurispect_api && source env/bin/activate && cd ..` to your `.bashrc`

Might also need to run the following installs:
```
pip install virtualenv
pip install virtualenvwrapper
```

As a second option, you could add the following set of functions to your `.bashrc` and then run `pve2 jurispect` from your terminal to enter into and create the virtual enviorment.

```
function pve() {
   local pd=/usr/local/bin/python
   local env_name=$1
   if [[ -z ${env_name} ]]; then
       if [[ -z ${VIRTUAL_ENV} ]]; then
           echo "usage: pve{2,3} <envname>"
           return 1
       else
           deactivate
           return 0
       fi
   fi
   if [[ ! -e ${pd} ]]; then
       echo "${pd} not found"
       return 1
   fi
   local system_python=$2
   if [[ ! -f "${system_python}" ]]; then
       echo "no system python found"
       return 1
   fi
   pushd ${pd}
   if [[ ! -f virtualenv.py ]]; then
       curl -L -O https://raw.github.com/pypa/virtualenv/master/virtualenv.py
   fi
   if [[ ! -d ${env_name} ]]; then
       echo "installing virtualenv"
       ${system_python} virtualenv.py ${env_name} --no-pip --no-wheel --no-setuptools
       if [[ ! -f get-pip.py ]]; then
           curl -L -O https://bootstrap.pypa.io/get-pip.py
       fi
       ${env_name}/bin/python ./get-pip.py
   fi
   echo "switching to existing Python environment ${env_name}"
   VIRTUAL_ENV_DISABLE_PROMPT=true
   source "${env_name}/bin/activate"
   popd
}

function pve2() {
   local system_python
   if [[ -f `which python2` ]]; then
       system_python=`which python2`
   elif [[ -f `which python2.7` ]]; then
       system_python=`which python2.7`
   elif [[ -f `which python2.6` ]]; then
       system_python=`which python2.6`
   else
       echo "no system python2 found"
       return 1
   fi
   pve "$1" "${system_python}"
}

function pve3() {
   local system_python
   if [[ -f `which python3` ]]; then
       system_python=`which python3`
   elif [[ -f `which python3.5` ]]; then
       system_python=`which python3.5`
   else
       echo "no system python3 found"
       return 1
   fi
   pve "$1" "${system_python}"
}

```

Remember, you will need to run `pve2 jurispect` everytime you open a new shell to return to the virtual env.

## Package setup

```
pip install -r requirements.txt
```

## Environment setup

Adjust .env in the following way:

```

API_ENV = development

```

NB: Find these on heroku for the integration environment:

```
ES_HOST=secret
BUILD_INDEX_NAME = 'lion'
```

Create a file named .boto in your home directory with the following contents. Swap AWS access/secret keys for placeholder values.

```
[Credentials]
aws_access_key_id = YOURACCESSKEY
aws_secret_access_key = YOURSECRETKEY
```

# Setup the dev db

Create the dev db and user

```
createuser -d -s jurispect   
createdb -U jurispect -w jurispect_users
```

Run all of the database migrations and then seeds the database a little bit:

```
bash migrations/setup_api.sh
```

Or, reset the dev db with

```
bash migrations/reset_api.sh
```

NB: migrations/reset_api.sh is same as migrations/setup_api.sh, except first line in 
migrations/reset_api.sh also deletes all tables currently in database.

## Run a python interpreter with the ORM pre-loaded

```
PYTHONSTARTUP=juriterm.py python
```

Then you can run model-based queries like:
```
db_session_users.query(User).count()
```
The first time you set-up and anytime thereafter that you reset the DB with `bash migrations/reset_api.sh` you will need to run the following commands:

```
from helpers.contributor_points_helper import seed_contributor_point_types

seed_contributor_point_types()
```

### Creating an API Key
```
api_key = ApiKey()
api_key.gen_token()
api_key.notes = "something to help identify this later"
db_session_users.add(api_key)
db_session_users.commit()
print(api_key.token) # <- this is the api key value to use with the API
```

## Database migrations

### "Users" database

#### Create the migration file
```
alembic -c alembic_users.ini revision --autogenerate -m "<high level name for db changes>"
```
Note: alembic currently does not autodetect changes for sequences and possibly some other things. It is always a good idea to double check that it auto-generated the correct diff.

#### Run the migration
```
alembic -c alembic_users.ini upgrade head
```

# Start the flask api

```
gunicorn -b "0.0.0.0:5000" -w 1 -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker --max-requests 1200 app:app --log-level debug -R --reload
```

# Unit tests

NB: there is a pre-requisite on the existence postgres databases "testing_users". 
NB: elasticsearch must be running

Run the unit tests with
```
nosetests -s
```

With a specific file:
```
nosetests -s test/test_user_get.py
```

For a single test within a file:
```
nosetests -s test/test_user_get.py:UserFetchTest.test_current_user
```

# Subscriptions

Plans table:

  for stripe plans, the stripe_id should equal the stripe_id in the dashboard on stripe.com.  Otherwise, the stripe_id in the plans table is used throughout the app to identify the plan.

Subscription table and corresponding logic:

  1) every user must have a subscription in the subscription table where latest=true. latest=true indicates that this is the user's current subscription.

  2) if a subscription is not to a stripe plan, the stripe_id in the subscriptions table should equal the plan stripe_id.  if the subscription is purchased through stripe, then stripe will give our server an id which automatically gets added to the stripe_id column.

  3) new users that signup through the app are automatically put on 30 day free trial.

  4) the payment_type can be stripe, invoice, or null (free trials)

  5)  properties is used for data stripe returns after a user purchases a subscription through stripe

  6) the start_date is the date the subscription started.

  7)  end_date is the date that the subscription ends and the user is given a new subscription in the table.

  8)  status can be active, inactive, or pending. users will be locked out of the app if their status is inactive.  pending subscriptions are set by admin. for example admin gives a user a pending subscription that start in 2100

  9)  status_reason can be null, expired, suspended, or user_cancelled

  10)  modified_by_user_id is the id of the admin user who changed the subscription.

  # Google Oauth

  The oauth credentials can be found here: https://console.developers.google.com/apis/credentials/oauthclient/862468174108-e0u7knr5auaqhq274c94vfhovfa59s84.apps.googleusercontent.com?project=pro-compliance-ai&authuser=0&organizationId=663342925391
