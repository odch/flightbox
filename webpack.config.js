var path = require('path');

module.exports = {
  entry: './app.js',
  output: {
    path: __dirname + '/build',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: [
          path.resolve(__dirname, './core'),
          path.resolve(__dirname, './components'),
          path.resolve(__dirname, './app.js'),
        ],
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: [ 'react', 'es2015' ]
        }
      },
      {
        test: /\.scss$/,
        loader: 'style!css!sass'
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        loader: 'url-loader?limit=10000'
      },
      {
        test: /\.(eot|ttf|wav|mp3)$/,
        loader: 'file-loader'
      }
    ]
  }
};
