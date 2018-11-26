# Compliance.ai Web Front-end

## Directory Structure

```
dist/                   // webpack build output
  app.js                // app bundle built w/ webpack
app/
  components/           // React Components
  styles/               // SCSS styles
    modules/            // variables for stylesheets (bootstrap,etc)
    partials/           // styles for various parts of the site
      components/       // styles for react components
  utils/                // non-react helper utils
  app.js                // React.render Root component
  routes.js             // routes for react-router
admin/                  // mostly replicates app/ structure
shared/
  assets/
  actions.js            // redux actions
  reducers.js           // redux reducer/store definitions
public/
  index.html
server.dev.js           // Dev server
server.prod.js          // Production server
webpack.app.config.dev.js
webpack.app.config.prod.js
webpack.admin.config.dev.js
webpack.admin.config.prod.js

```

## Technology

The Compliance.ai app is built upon React and Redux.

## Installation

For dev:
Copy .env.example to .env

```
npm install
```

## Running

Start a local server:

```
npm start
```

Note: when running on a cloud instance, .env needs to be updated so
the HOSTNAME is 0.0.0.0 and the JURISPECT_API_URL is
http://<cloud instance's wan ip>:5000.  The corresponding API server also needs to
listen on 0.0.0.0:5000 in this scenario.

## Developing

Any changes you make to files in the `app/` directory will cause the server to
automatically rebuild the app and refresh your browser.

### Admin site

    ADMIN_ENABLED=1 npm start

The admin site looks for the prefix `admin.` in the host name. Adding
an entry to `/etc/hosts` is the easiest way to get this to work.

### Editor Config

Install the [EditorConfig Plugin](http://editorconfig.org) for your
editor of choice to ensure consistent formatting.

### React Developer Tools

Install the
[React Developer Tools Chrome Plugin](https://github.com/facebook/react-devtools)
for better debugging.
