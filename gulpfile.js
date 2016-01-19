const gulp = require('gulp');
const mocha = require('gulp-mocha');
const babel = require('babel-core/register');
const webpack = require('gulp-webpack');
const del = require('del');
const env = require('gulp-env');

require('ignore-styles');
require('babel-polyfill');

gulp.task('clean', function () {
  const config = require('./webpack.config.js');
  return del([config.output.path]);
});

gulp.task('build', ['clean'], function () {
  const config = require('./webpack.config.js');
  return gulp.src(config.entry)
    .pipe(webpack(config))
    .pipe(gulp.dest(config.output.path))
    .pipe(gulp.src('./index.html')
      .pipe(gulp.dest(config.output.path))
    );
});

gulp.task('prod-env', function () {
  env({
    vars: {
      ENV: 'production',
    },
  });
});

gulp.task('build:prod', ['prod-env', 'build']);

gulp.task('test', function () {
  return gulp
    .src('./test/**/*.js')
    .pipe(mocha({
      compilers: {
        js: babel,
      },
    }));
});

