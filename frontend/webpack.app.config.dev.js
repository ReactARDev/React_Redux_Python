require('dotenv-safe').config();
require('babel-register');
const flexbugsFixes = require('postcss-flexbugs-fixes');
const cssnext = require('postcss-cssnext');

const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: [
    'eventsource-polyfill', // necessary for hot reloading with IE
    'webpack-hot-middleware/client',
    path.join(__dirname, 'app', 'app.js')
  ],

  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
    filename: 'app.js'
  },

  devtool: 'eval-source-map', // http://webpack.github.io/docs/configuration.html#devtool

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        PORT: JSON.stringify(process.env.PORT),
        JURISPECT_API_URL: JSON.stringify(process.env.JURISPECT_API_URL),
        JURISPECT_API_URL_GA: JSON.stringify(process.env.JURISPECT_API_URL_GA),
        JURISPECT_DATA_API_URL: JSON.stringify(process.env.JURISPECT_DATA_API_URL),
        JURISPECT_SLOT_DATA_API_URL: JSON.stringify(process.env.JURISPECT_SLOT_DATA_API_URL),
        APPLICATION_URL: JSON.stringify(process.env.APPLICATION_URL),
        ADMIN_APPLICATION_URL: JSON.stringify(process.env.ADMIN_APPLICATION_URL),
        AGENCY_LANDING_PAGE_URL: JSON.stringify(process.env.AGENCY_LANDING_PAGE_URL),
        STATE_DATA_ENABLED: JSON.parse(process.env.STATE_DATA_ENABLED),
        STRIPE_PUBLIC_KEY: JSON.stringify(process.env.STRIPE_PUBLIC_KEY),
        LINKEDIN_CLIENT_ID: JSON.stringify(process.env.LINKEDIN_CLIENT_ID),
        LINKEDIN_LOGIN_REDIRECT_URL: JSON.stringify(process.env.LINKEDIN_LOGIN_REDIRECT_URL),
        LINKEDIN_ACTIVATE_REDIRECT_URL: JSON.stringify(process.env.LINKEDIN_ACTIVATE_REDIRECT_URL),
        GOOGLE_CLIENT_ID: JSON.stringify(process.env.GOOGLE_CLIENT_ID),
        GOOGLE_LOGIN_REDIRECT_URL: JSON.stringify(process.env.GOOGLE_LOGIN_REDIRECT_URL),
        GOOGLE_ACTIVATE_REDIRECT_URL: JSON.stringify(process.env.GOOGLE_ACTIVATE_REDIRECT_URL),
        ONBOARDING_TOOLTIP_ENABLED: JSON.stringify(process.env.ONBOARDING_TOOLTIP_ENABLED),
        CONTRIBUTOR_FORM_URI: JSON.stringify(process.env.CONTRIBUTOR_FORM_URI),
        BUGSNAG_API_KEY: process.env.BUGSNAG_API_KEY
          ? JSON.stringify(process.env.BUGSNAG_API_KEY)
          : null,
        RSS_ENABLED: JSON.parse(process.env.RSS_ENABLED),
      }
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],

  eslint: {
    emitWarning: true // treat errors as warnings so HMR doesn't break
  },

  module: {
    preLoaders: [
      {
        test: /\.js$/,
        loaders: ['eslint-loader'],
        exclude: /node_modules/
      }
    ],
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        exclude: /node_modules/
      },
      {
        test: /\.json$/,
        loaders: ['json']
      },
      {
        test: /\.css$/,
        loaders: ['style', 'css']
      },
      {
        test: /\.scss$/,
        loaders: ['style', 'css', 'postcss', 'sass']
      },
      {
        test: /\.(png|gif|jpg)$/,
        loaders: ['url']
      },
      {
        test: /\.woff(2)?(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=8192&mimetype=application/font-woff'
      },
      {
        test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=8192&mimetype=application/octet-stream'
      },
      {
        test: /\.otf(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=8192&mimetype=application/octet-stream'
      },
      {
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file'
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=8192&mimetype=image/svg+xml'
      }
    ],
    // needed to silence warning (https://github.com/niklasvh/html2canvas/issues/749):
    noParse: [/html2canvas/]
  },
  // cssnext adds browser-specific css prefixes ane more!
  postcss: function () {
    return [flexbugsFixes(), cssnext()];
  }
};
