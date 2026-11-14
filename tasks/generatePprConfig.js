'use strict';

const fs = require('fs');
const projects = require('../projects');
// The checks the functions apply at runtime, so a value accepted here is used
// as it is in the PPR emails.
const { SAFE_COLOR_REGEX } = require('../functions/email/themeColor');
const { httpsOrigin } = require('../functions/ppr/httpsOrigin');

// Builds functions/ppr-config.generated.js, which the Cloud Functions read at
// deploy and at run time (functions/ppr/deployConfig.js): whether PPR is on,
// the Firebase project the file is for, and the aerodrome's name, theme
// colour and app URL for the PPR emails. The values are resolved exactly like
// the client's `__CONF__` in webpack.config.js, so the PPR routes and cleanup
// job are deployed where the PPR pages are built.

const ENVS = ['test', 'production'];

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

// The optional values are not set when absent or null (an environment can
// set null to drop a top-level value).
const isSet = value => value !== undefined && value !== null;

function configError(project, env, field, problem) {
  return new Error(
    `Invalid PPR config for project "${project}" (env "${env}"): ${field} ${problem}`
  );
}

// Same shallow merge as webpack.config.js:11-16. An environment-level key
// replaces the whole top-level value (e.g. `aerodrome`), it is not merged.
function mergeEnvironment(project, conf, env) {
  if (!ENVS.includes(env)) {
    throw configError(project, env, 'env', `must be one of ${ENVS.join(', ')}`);
  }
  const { environments, ...rest } = conf;
  if (!isPlainObject(environments) || !hasOwn(environments, env) || !isPlainObject(environments[env])) {
    throw configError(project, env, `environments.${env}`, 'is not defined');
  }
  return { ...rest, ...environments[env] };
}

function readAerodromeName(project, env, { aerodrome }) {
  if (!isSet(aerodrome)) {
    return undefined;
  }
  if (!isPlainObject(aerodrome)) {
    throw configError(project, env, 'aerodrome', 'must be an object');
  }
  const { name } = aerodrome;
  if (!isSet(name)) {
    return undefined;
  }
  if (typeof name !== 'string' || name.trim() === '') {
    throw configError(project, env, 'aerodrome.name', `must be a non-empty string: ${JSON.stringify(name)}`);
  }
  return name;
}

function readThemeColor(project, env, { themeColor }) {
  if (!isSet(themeColor)) {
    return undefined;
  }
  if (typeof themeColor !== 'string' || !SAFE_COLOR_REGEX.test(themeColor)) {
    throw configError(project, env, 'themeColor',
      `must be a hex colour or a colour name (${SAFE_COLOR_REGEX}): ${JSON.stringify(themeColor)}`);
  }
  return themeColor;
}

// The app's address, the base of links in the PPR emails
function readAppUrl(project, env, { appUrl }) {
  if (!isSet(appUrl)) {
    return undefined;
  }
  const origin = httpsOrigin(appUrl);
  if (origin === null) {
    throw configError(project, env, 'appUrl', 'must be an https origin like "https://example.web.app"'
      + ` (no credentials, path, query or fragment): ${JSON.stringify(appUrl)}`);
  }
  return origin;
}

/**
 * Pure. `conf` is what `projects.load(project)` returns, `env` is 'test' or
 * 'production', `firebaseProjectId` the Firebase project of the deploy (the
 * functions only honour the file there). Throws for a value the functions
 * could not use; the message names the project, env and field. Values the
 * project does not set are undefined.
 */
function buildPprConfig(project, conf, env, firebaseProjectId) {
  if (!isPlainObject(conf)) {
    throw configError(project, env, 'conf', 'must be an object');
  }
  const merged = mergeEnvironment(project, conf, env);
  if (typeof firebaseProjectId !== 'string' || firebaseProjectId === '') {
    throw configError(project, env, 'Firebase project', `must be a non-empty string: ${JSON.stringify(firebaseProjectId)}`);
  }

  return {
    enabled: merged.ppr === true,
    firebaseProjectId,
    aerodromeName: readAerodromeName(project, env, merged),
    themeColor: readThemeColor(project, env, merged),
    appUrl: readAppUrl(project, env, merged)
  };
}

function buildPprConfigFor(project, env, firebaseProjectId) {
  return buildPprConfig(project, projects.load(project), env, firebaseProjectId);
}

// JSON.stringify leaves out the undefined values, so the file of a project
// without them keeps its former shape ({ enabled, firebaseProjectId }).
function formatPprConfig(config) {
  return `module.exports = ${JSON.stringify(config)};\n`;
}

const USAGE = 'Usage: node tasks/generatePprConfig.js <project> <test|production> <output file>'
  + ' <Firebase project>';

// Writes the PPR config of a project/env for the functions deploy (see
// .github/workflows). Returns the exit code; an invalid config fails the
// deploy instead of shipping emails with a broken header or links.
function main(args) {
  if (args.length !== 4) {
    console.error(USAGE);
    return 1;
  }
  const [project, env, outFile, firebaseProjectId] = args;
  try {
    const config = buildPprConfigFor(project, env, firebaseProjectId);
    fs.writeFileSync(outFile, formatPprConfig(config));
  } catch (e) {
    console.error(e.message);
    return 1;
  }
  return 0;
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}

module.exports = {
  buildPprConfig,
  buildPprConfigFor,
  formatPprConfig,
  main
};
