'use strict';

const fs = require('fs');
const projects = require('../projects');

// Builds the tenant config the Cloud Functions need (airstat report) from a
// project file, resolved exactly like the client's `__CONF__` in
// webpack.config.js. Only whitelisted fields are returned, so secrets and
// unrelated settings (API keys, fees, theme, ...) never reach functions/.

const ENVS = ['test', 'production'];

const ICAO_RE = /^[A-Z0-9]{4}$/;

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function configError(project, env, field, problem) {
  return new Error(
    `Invalid server config for project "${project}" (env "${env}"): ${field} ${problem}`
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

// The client reads runways as `objectToArray(packinize(runways))`:
// packinize turns the array into an index-keyed object and objectToArray
// sorts those keys as strings ("10" before "2"). Use the same order so a
// tenant with more than ten runways sees them identically on both sides.
function clientOrder(array) {
  return Object.keys(array).sort().map(key => array[key]);
}

function buildRunways(project, env, runways) {
  if (!Array.isArray(runways) || runways.length === 0) {
    throw configError(project, env, 'aerodrome.runways', 'must be a non-empty array');
  }
  const seen = new Set();
  return clientOrder(runways).map(runway => {
    if (!isPlainObject(runway)) {
      throw configError(project, env, 'aerodrome.runways', `contains a non-object entry: ${JSON.stringify(runway)}`);
    }
    if (typeof runway.name !== 'string' || runway.name === '') {
      throw configError(project, env, 'aerodrome.runways[].name', `must be a non-empty string: ${JSON.stringify(runway.name)}`);
    }
    if (typeof runway.type !== 'string') {
      throw configError(project, env, `aerodrome.runways[${runway.name}].type`, `must be a string: ${JSON.stringify(runway.type)}`);
    }
    if (seen.has(runway.name)) {
      throw configError(project, env, 'aerodrome.runways', `contains duplicate name "${runway.name}"`);
    }
    seen.add(runway.name);
    return { name: runway.name, type: runway.type };
  });
}

// Optional flags: absent means false, like the client's `=== true` checks.
function readFlag(project, env, merged, key) {
  if (hasOwn(merged, key) && typeof merged[key] !== 'boolean') {
    throw configError(project, env, key, `must be a boolean: ${JSON.stringify(merged[key])}`);
  }
  return merged[key] === true;
}

/**
 * Pure. `conf` is what `projects.load(project)` returns, `env` is 'test' or
 * 'production'. Throws when the config is not usable by the functions; the
 * message names the project, env and field.
 */
function buildServerConfig(project, conf, env) {
  if (!isPlainObject(conf)) {
    throw configError(project, env, 'conf', 'must be an object');
  }
  const merged = mergeEnvironment(project, conf, env);

  const { firebaseProjectId, aerodrome } = merged;
  if (typeof firebaseProjectId !== 'string' || firebaseProjectId === '') {
    throw configError(project, env, 'firebaseProjectId', `must be a non-empty string: ${JSON.stringify(firebaseProjectId)}`);
  }
  if (!isPlainObject(aerodrome)) {
    throw configError(project, env, 'aerodrome', 'must be an object');
  }
  if (typeof aerodrome.ICAO !== 'string' || !ICAO_RE.test(aerodrome.ICAO)) {
    throw configError(project, env, 'aerodrome.ICAO', `must match ${ICAO_RE}: ${JSON.stringify(aerodrome.ICAO)}`);
  }

  return {
    project,
    env,
    firebaseProjectId,
    reportApiEnabled: readFlag(project, env, merged, 'reportApiEnabled'),
    memberManagement: readFlag(project, env, merged, 'memberManagement'),
    aerodrome: {
      ICAO: aerodrome.ICAO,
      runways: buildRunways(project, env, aerodrome.runways)
    }
  };
}

function buildServerConfigFor(project, env) {
  return buildServerConfig(project, projects.load(project), env);
}

const USAGE = 'Usage: node tasks/generateServerConfig.js <project> <test|production> <output file>'
  + ' [<expected Firebase project>]';

// Writes the config of a project/env as JSON for the functions deploy (see
// .github/workflows and functions/projectConfig.js). Returns the exit code;
// an invalid config, or one for another Firebase project than the deploy
// target, fails the deploy instead of shipping a config the functions ignore.
function main(args) {
  if (args.length < 3 || args.length > 4) {
    console.error(USAGE);
    return 1;
  }
  const [project, env, outFile, expectedProjectId] = args;
  try {
    const config = buildServerConfigFor(project, env);
    if (expectedProjectId !== undefined && config.firebaseProjectId !== expectedProjectId) {
      throw new Error(`Config of project "${project}" (env "${env}") is for Firebase project `
        + `"${config.firebaseProjectId}", not "${expectedProjectId}"`);
    }
    fs.writeFileSync(outFile, JSON.stringify(config, null, 2) + '\n');
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
  buildServerConfig,
  buildServerConfigFor,
  main
};
