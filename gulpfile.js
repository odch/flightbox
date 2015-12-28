const gulp = require('gulp');
const mocha = require('gulp-mocha');
const babel = require('babel-core/register');
const webpack = require('gulp-webpack');
const del = require('del');

require('ignore-styles');

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

gulp.task('test', function () {
  return gulp
    .src('./test/**/*.js')
    .pipe(mocha({
      compilers: {
        js: babel,
      },
    }));
});

