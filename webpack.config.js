const projects = require('./projects');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
  __FIREBASE_DATABASE_URL__: JSON.stringify(env.firebaseDatabaseUrl),
  __FIREBASE_API_KEY__: JSON.stringify(env.firebaseApiKey),
  __DISABLE_IP_AUTHENTICATION__: env.disableIpAuthentication === true,
  __FLIGHTNET_COMPANY__: JSON.stringify(projectConf.flightnetCompany),
  __LANDING_FEES_STRATEGY__: JSON.stringify(projectConf.aerodrome.landingFeesStrategy),
  __LANDING_FEES__: JSON.stringify(projectConf.aerodrome.landingFees),
  __GO_AROUND_FEES__: JSON.stringify(projectConf.aerodrome.goAroundFees)
};

module.exports = {
  mode: process.env.ENV === 'production' ? 'production' : 'development',
  entry: [
    '@babel/polyfill',
    path.resolve(__dirname, './src/app.js'),
    path.resolve(__dirname, './theme/' + projectConf.theme)
  ],
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'bundle.[contenthash].js',
    clean: true,
  },
  resolve: {
    fallback: {
      "stream": require.resolve("stream-browserify"),
      "util": require.resolve("util/"),
      "path": false,
      "fs": false
    },
    extensions: ['.js', '.jsx', '.json']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules\/(?!(idb|@firebase)\/).*/,
        use: {
          loader: 'babel-loader',
        }
      },
      {
        test: /\.s?css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10000 // Inline images < 10kb
          }
        }
      },
      {
        test: /\.(eot|ttf|wav|mp3)$/,
        type: 'asset/resource',
      }
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser', // Injects the process polyfill
    }),
    new webpack.DefinePlugin(globals),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './index.html'),
      filename: 'index.html',
      inject: 'body',
      title: projectConf.title,
    }),
  ],
};
