# Branching scheme

* production environment syncs with the `production` branch
* integration environment syncs with the `master` branch

# Integration environment

## Run any database migrations
If there have been any database migrations, run the following command against the integration environment *before* deploying the code
```
alembic -c alembic_users.ini upgrade head
```

Note: I recommend keeping a .env_integration file with your integration database configuration details, and overwriting the active .env file (typically for dev and called say .env_dev_with_index) with it.

## Code deploy

Ensure the local master branch is up to date, then push to the heroku remote for the integration environment.
```
git push heroku-integration master
```

### Heroku remote setup

```
git remote add heroku-integration https://git.heroku.com/complianceai-api-integration.git
```

# Production environment

## Run any database migrations
If there have been any database migrations, run the following command against the production environment *before* deploying the code
```
alembic -c alembic_users.ini upgrade head
```

Note: I recommend keeping a .env_integration file with your integration database configuration details, and overwriting the active .env file (typically for dev and called say .env_dev_with_index) with it.

Note: This process will work fine for table/row additions, row deletions/changes could cause issues if not timed correctly. Talk any such changes over with the rest of the team before running migrations on production.

## Production branch update

### Production pull request

* Create a pull request from the `master` branch to the `production` branch: https://bitbucket.org/jurispect/jurispect_api/pull-requests/new

### Review

* A traditional code review is not necessary here
* Record information about who QA'd it and who approved it, or that it needs to go out now for such and such reason
* Any review of the code should generally be restricted to whether the automatic merge will go through cleanly
* So long as someone else has looked at the changes in some capacity, the PR creator can be the one to merge this
* Be sure to alert the #product channel on slack that you are pushing changes to production regardless of who already is aware of the coming update. 

### Setup for deploy

* Merge the pull request in bitbucket
* Sync code on local branch that will be used in the code deploy step
* Before deploying please verify the changes you expect to be sent up are in fact going by first fetching `git fetch --all` (assuming you have all the proper remotes set up, if not see below) and then checking the `git diff heroku-production/master`

## Code deploy

Once the local `production` branch is up to date, then push to the heroku remote for the production environment.
```
git push heroku-production production:master
```

### Heroku remote setup

```
git remote add heroku-production https://git.heroku.com/complianceai-api-production.git
```

### Cherry-Picking / Hot-Fixes 

First, be ABSOLUTELY sure you have to do this! Cherry picks screw with the timeline of the codebase and can be a real pain to have to fix later.
 
If you are certain that this must be done and there is no way the change can wait for regular review follow these steps:

* Find the commit SHA related to the change you want to push. This can usually be found on bitbucket. Do your best to keep the change you are pushing under one commit. Additional commits will require more careful work. 
* When you have the SHA related to your change, `git checkout master` or whichever branch to which the change should be applied. 
* `git cherry-pick [SHA]`
* `git push origin master` or whichever branch to which the change should be applied.
* Lastly, if you are pushing the change to either integration or production, follow the steps outlined above. 