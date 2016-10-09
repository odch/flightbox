const path = require('path');
const webpack = require('webpack');

const globals = {
  __DEV__: process.env.DEV || false,
};

if (process.env.ENV === 'production') {
  globals.__FIREBASE_URL__ = JSON.stringify('https://lszt.firebaseio.com');
  globals.__IP_AUTH__ = JSON.stringify('https://api.mfgt.ch/api/v1/firebaseauth/ip');
  globals.__CREDENTIALS_AUTH__ = JSON.stringify('https://api.mfgt.ch/api/v1/firebaseauth/mfgt');
} else {
  globals.__FIREBASE_URL__ = JSON.stringify('https://mfgt-flights.firebaseio.com');
  globals.__IP_AUTH__ = JSON.stringify('https://api.mfgt.ch/api/v1/firebaseauth/ip-test');
  globals.__CREDENTIALS_AUTH__ = JSON.stringify('https://api.mfgt.ch/api/v1/firebaseauth/mfgt-test');
}

module.exports = {
  entry: [
    'babel-polyfill',
    'whatwg-fetch',
    path.resolve(__dirname, './src/app.js'),
  ],
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, './src'),
        ],
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
