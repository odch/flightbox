const projects = require('./projects');
const path = require('path');
const webpack = require('webpack');

const projectName = process.env.npm_config_project || 'lszt';

const projectConf = projects.load(projectName);

const theme = projectConf.theme || 'lszt';

const env = process.env.ENV === 'production'
  ? projectConf.environments.production
  : projectConf.environments.test;

const globals = {
  __DEV__: process.env.DEV || false,
  __CONF__: projects.packinize(projectConf),
  __THEME__: JSON.stringify(theme),
  __FIREBASE_URL__: JSON.stringify(env.firebase),
  __IP_AUTH__: JSON.stringify(env.ipAuth),
  __CREDENTIALS_AUTH__: JSON.stringify(env.credentialsAuth),
};

module.exports = {
  entry: [
    'babel-polyfill',
    'whatwg-fetch',
    path.resolve(__dirname, './src/app.js'),
    path.resolve(__dirname, './theme/' + theme)
  ],
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['react', 'es2015'],
        },
      },
      {
        test: /\.s?css$/,
        loader: 'style!css!sass',
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        loader: 'url-loader?limit=10000',
      },
      {
        test: /\.(eot|ttf|wav|mp3)$/,
        loader: 'file-loader',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin(globals),
  ],
};
