require('babel-register');

const path = require('path');
const webpack = require('webpack');

module.exports = {
  // TODO: For production build we want to extract CSS to stand-alone file
  // Provide `extractStyles` param and `bootstrap-loader` will handle it
  entry: [path.join(__dirname, 'admin', 'admin.js')],

  output: {
    path: path.join(__dirname, 'dist/admin'),
    publicPath: '/',
    filename: 'admin.js'
  },

  devtool: 'source-map', // http://webpack.github.io/docs/configuration.html#devtool

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
        IFRAME_API_KEY: JSON.stringify(process.env.IFRAME_API_KEY),
        HOSTNAME: JSON.stringify(process.env.HOSTNAME),
        BUGSNAG_API_KEY: process.env.BUGSNAG_API_KEY
          ? JSON.stringify(process.env.BUGSNAG_API_KEY)
          : null
      }
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false
      }
    })
  ],

  module: {
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
        loaders: ['style', 'css', 'sass']
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
        test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file'
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'url?limit=8192&mimetype=image/svg+xml'
      }
    ]
  }
};
