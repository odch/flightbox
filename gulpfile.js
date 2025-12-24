const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const webpackStream = require('webpack-stream');
const webpackCore = require('webpack');
const env = require('gulp-env');
const rename = require('gulp-rename');
const through2 = require('through2');
const projects = require('./projects');
const processFirebaseRules = require('./tasks/processFirebaseRules');

require('ignore-styles');
require('@babel/polyfill');

const prettyPrintJson = () => through2.obj((file, enc, cb) => {
  if (file.isNull()) {
    return cb(null, file);
  }
  if (file.isBuffer()) {
    try {
      const jsonContent = JSON.parse(file.contents.toString());
      const prettyJson = JSON.stringify(jsonContent, null, 2);
      file.contents = Buffer.from(prettyJson);
      return cb(null, file);
    } catch (error) {
      return cb(new Error(`Invalid JSON format in ${file.path}`));
    }
  }
  cb(null, file);
});

async function clean() {
  const config = require('./webpack.config.js');
  const { deleteAsync } = await import('del');
  return await deleteAsync([config.output.path]);
}

async function prodEnv() {
  env({
    vars: {
      ENV: 'production',
    },
  });
}

function bundleJS() {
  const config = require('./webpack.config.js');
  return webpackStream(config, webpackCore)
    .pipe(gulp.dest(config.output.path));
}

function copyResetCss() {
  const config = require('./webpack.config.js');
  return gulp.src('./reset.css', { base: './', allowEmpty: true })
    .pipe(gulp.dest(config.output.path));
}

function copyFavicons(done) {
  const config = require('./webpack.config.js');
  const projectName = process.env.npm_config_project || 'lszt';
  const projectConf = projects.load(projectName);

  const faviconDir = path.join(__dirname, 'theme', projectConf.theme, 'favicons');

  if (!fs.existsSync(faviconDir)) {
    console.log(`⚠️  Skipping favicons: Directory not found at ${faviconDir}`);
    return done();
  }

  return gulp.src(path.join(faviconDir, '*'), {
    base: path.join(__dirname, 'theme', projectConf.theme),
    allowEmpty: true
  })
    .pipe(gulp.dest(config.output.path));
}

function buildFirebaseRules() {
  const config = require('./webpack.config.js');
  const projectName = process.env.npm_config_project || 'lszt';
  const projectConf = projects.load(projectName);

  return gulp.src('./firebase-rules-template.json', { allowEmpty: true })
    .pipe(processFirebaseRules(projectConf))
    .pipe(prettyPrintJson())
    .pipe(rename('firebase-rules.json'))
    .pipe(gulp.dest(config.output.path));
}

const assets = gulp.parallel(copyResetCss, copyFavicons, buildFirebaseRules);

exports.clean = clean;
exports.build = gulp.series(clean, bundleJS, assets);
exports['build:prod'] = gulp.series(prodEnv, clean, bundleJS, assets);

exports.default = exports.build;
