const gulp = require('gulp');
const webpack = require('webpack-stream');
const del = require('del');
const env = require('gulp-env');
const merge = require('merge-stream');
const rename = require('gulp-rename');
const through2 = require('through2');
const projects = require('./projects');
const processFirebaseRules = require('./tasks/processFirebaseRules');

require('ignore-styles');
require('@babel/polyfill');

const prettyPrintJson = () => through2.obj((file, _, cb) => {
  if (file.isBuffer()) {
    try {
      const jsonContent = JSON.parse(file.contents.toString());
      const prettyJson = JSON.stringify(jsonContent, null, 2); // Pretty-print with 2 spaces
      file.contents = Buffer.from(prettyJson);
    } catch (error) {
      return cb(new Error('Invalid JSON format'));
    }
  }
  cb(null, file);
});

function clean() {
  const config = require('./webpack.config.js');
  return del([config.output.path]);
}

function buildTask() {
  const config = require('./webpack.config.js');

  const projectName = process.env.npm_config_project || 'lszt';
  const projectConf = projects.load(projectName);

  const bundle = gulp.src('./src/app.js')
    .pipe(webpack(config))
    .pipe(gulp.dest(config.output.path));

  const copy = gulp.src(['./reset.css'], { base: './' })
    .pipe(gulp.dest(config.output.path));

  const favicons = gulp.src(['./theme/' + projectConf.theme + '/favicons/*'], { base: './theme/' + projectConf.theme })
    .pipe(gulp.dest(config.output.path));

  const rules = gulp.src(['./firebase-rules-template.json'], { base: './' })
    .pipe(processFirebaseRules(projectConf))
    .pipe(prettyPrintJson())
    .pipe(rename('firebase-rules.json'))
    .pipe(gulp.dest(config.output.path));

  return merge(bundle, copy, favicons, rules);
}

function prodEnv(done) {
  env({
    vars: {
      ENV: 'production',
    },
  });
  done();
}

// Export tasks
exports.clean = clean;
exports.build = gulp.series(clean, buildTask);
exports['build:prod'] = gulp.series(prodEnv, clean, buildTask);

// Default task
exports.default = exports.build;
