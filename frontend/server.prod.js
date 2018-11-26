/* eslint-disable no-console */

const compression = require('compression');
const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');
const app = express();

const PORT = process.env.PORT;
const SPOOF_PROD = process.env.SPOOF_PROD; // disables HTTPS

// force HTTPS
if (!SPOOF_PROD) {
  app.use((req, resp, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return resp.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    return next();
  });
}

app.use(compression());
app.use(favicon(`${__dirname}/dist/favicon.ico`));

if (JSON.parse(process.env.RSS_ENABLED)) {
  app.use('/rss', (req, res) => {
    const RSS = require('./shared/utils/rss.js').default;
    const rss = new RSS();
    rss.getFeed(feed => {res.send(feed)})
  });
}

app.use('/', (req, res, next) => {
  const subdomains = req.hostname.split('.');

  // prod is admin.jurispect.com, integration is admin-integration.jurispect.com
  if (subdomains[0] === 'admin' || subdomains[0] === 'admin-integration') {
    express.static(`${__dirname}/dist/admin`)(req, res, next);
  } else {
    express.static(`${__dirname}/dist/app`)(req, res, next);
  }
});

app.get('*', function (req, res, next) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, err => {
  if (err) {
    console.error(`Error starting server: ${err}`);
    return;
  }
  console.log('Server is listening');
});
