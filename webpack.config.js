const projects = require('./projects');
const path = require('path');
const webpack = require('webpack');

const projectName = process.env.npm_config_project || 'lszt';

const projectConf = projects.load(projectName);

const env = process.env.ENV === 'production'
  ? projectConf.environments.production
  : projectConf.environments.test;

const globals = {
  __DEV__: process.env.DEV || false,
  __CONF__: projects.packinize(projectConf),
  __THEME__: JSON.stringify(projectConf.theme),
  __FIREBASE_PROJECT_ID__: JSON.stringify(env.firebaseProjectId),
  __FIREBASE_DATABASE_NAME__: JSON.stringify(env.firebaseDatabaseName),
  __FIREBASE_API_KEY__: JSON.stringify(env.firebaseApiKey),
  __DISABLE_IP_AUTHENTICATION__: env.disableIpAuthentication === true,
  __FLIGHTNET_COMPANY__: JSON.stringify(projectConf.flightnetCompany),
};

module.exports = {
  entry: [
    '@babel/polyfill',
    'whatwg-fetch',
    path.resolve(__dirname, './src/app.js'),
    path.resolve(__dirname, './theme/' + projectConf.theme)
  ],
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.s?css$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
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
