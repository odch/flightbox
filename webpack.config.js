const path = require('path');

module.exports = {
  externals: {
    'Config': JSON.stringify(process.env.ENV === 'production' ? {
      firebaseUrl: 'https://flights.lszt.ch',
    } : {
      firebaseUrl: 'https://mfgt-flights.firebaseio.com',
    }),
  },
  entry: [
    'babel-polyfill',
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
};
