/* eslint-disable no-console */

const favicon = require('serve-favicon');
const path = require('path');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const appConfig = require('./webpack.app.config.dev.js');
const adminConfig = require('./webpack.admin.config.dev.js');

const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;
const app = express();

function mountApp(app, config) {
  // eslint-disable-line no-shadow
  const compiler = webpack(config);
  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: config.output.publicPath,
      noInfo: true,
      hot: true,
      historyApiFallback: true,
      stats: {
        colors: true,
        hash: false,
        version: false,
        chunks: false,
        children: false
      }
    })
  );

  app.use(webpackHotMiddleware(compiler, { log: console.log }));
}

app.use(favicon(`${__dirname}/public/favicon.ico`));

mountApp(app, appConfig);

if (process.env.ADMIN_ENABLED) {
  mountApp(app, adminConfig);
}

if (JSON.parse(process.env.RSS_ENABLED)) {
  app.use('/rss', (req, res) => {
    const RSS = require('./shared/utils/rss.js').default;
    const rss = new RSS();
    rss.getFeed(feed => {res.send(feed)})
  });
}

app.use('/', (req, res) => {
  const subdomains = req.hostname.split('.');

  // prod is admin.jurispect.com, integration is admin-integration.jurispect.com
  if (subdomains[0] === 'admin' || subdomains[0] === 'admin-integration') {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.listen(PORT, HOSTNAME, err => {
  if (err) {
    console.log(`🙀 ${err}`);
    return;
  }
  console.log(`🔥  App is now running on http://${HOSTNAME}:${PORT}`);
});
