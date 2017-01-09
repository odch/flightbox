const gulp = require('gulp');
const mocha = require('gulp-mocha');
const babel = require('babel-core/register');
const webpack = require('gulp-webpack');
const del = require('del');
const env = require('gulp-env');
const merge = require('merge-stream');
const replace = require('gulp-replace');
const projects = require('./projects');
const processFirebaseRules = require('./tasks/processFirebaseRules');

require('ignore-styles');
require('babel-polyfill');

gulp.task('clean', function () {
  const config = require('./webpack.config.js');
  return del([config.output.path]);
});

gulp.task('build', ['clean'], function () {
  const config = require('./webpack.config.js');

  const projectName = process.env.npm_config_project || 'lszt';
  const projectConf = projects.load(projectName);

  const bundle = gulp.src(config.entry)
    .pipe(webpack(config))
    .pipe(gulp.dest(config.output.path));

  const copy = gulp.src(['./index.html', './reset.css'], { base: './' })
    .pipe(replace('%TITLE%', projectConf.title))
    .pipe(gulp.dest(config.output.path));

  const favicons = gulp.src(['./theme/' + projectConf.theme + '/favicons/*'], { base: './theme/' + projectConf.theme })
    .pipe(gulp.dest(config.output.path));

  const rules = gulp.src(['./firebase-rules.json'], { base: './' })
    .pipe(processFirebaseRules(projectConf.aerodrome))
    .pipe(gulp.dest(config.output.path));

  return merge(bundle, copy, favicons, rules);
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
    .src('./src/**/*.spec.js')
    .pipe(mocha({
      compilers: {
        js: babel,
      },
    }));
});
