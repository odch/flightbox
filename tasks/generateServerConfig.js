'use strict';

const fs = require('fs');
const projects = require('../projects');
const defaultConf = require('../projects/default.json');
const aircraftCategoriesData = require('../src/util/aircraftCategoriesData');

// Builds the tenant config the Cloud Functions need (airstat report, MCP
// endpoint, movement writes) from a project file, resolved exactly like the
// client's `__CONF__` in webpack.config.js. Only whitelisted fields are
// returned, so secrets and unrelated settings (API keys, fees, theme, ...)
// never reach functions/.

const ENVS = ['test', 'production'];

const ICAO_RE = /^[A-Z0-9]{4}$/;

// The database rules (tasks/processFirebaseRules.js, gulpfile.js) are built
// from the top-level project config only. The movement domain in functions/
// mirrors those rules, so these fields must not differ per environment.
const TOP_LEVEL_ONLY = ['enabledFlightTypes', 'loginForm', 'lockOnDateTime'];

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
  TOP_LEVEL_ONLY.forEach(key => {
    if (hasOwn(environments[env], key)) {
      throw configError(project, env, `environments.${env}.${key}`,
        'is not supported: the database rules read it from the top level only');
    }
  });
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

// Departure/arrival routes, by name only (the label is display text). Same
// order as the client reads them; an empty list is allowed (only 'circuits'
// remains, see processFirebaseRules.js processRoute).
function buildRoutes(project, env, routes, field) {
  if (!Array.isArray(routes)) {
    throw configError(project, env, field, 'must be an array');
  }
  const seen = new Set();
  return clientOrder(routes).map(route => {
    if (!isPlainObject(route) || typeof route.name !== 'string' || route.name === '') {
      throw configError(project, env, `${field}[].name`, `must be a non-empty string: ${JSON.stringify(route)}`);
    }
    if (seen.has(route.name)) {
      throw configError(project, env, field, `contains duplicate name "${route.name}"`);
    }
    seen.add(route.name);
    return { name: route.name };
  });
}

// projects.load() merges projects/default.json, so the default only applies
// to a conf passed in directly; it is the client's default either way.
function buildFlightTypes(project, env, merged) {
  const flightTypes = hasOwn(merged, 'enabledFlightTypes')
    ? merged.enabledFlightTypes
    : defaultConf.enabledFlightTypes;
  if (!Array.isArray(flightTypes) || flightTypes.length === 0) {
    throw configError(project, env, 'enabledFlightTypes', 'must be a non-empty array');
  }
  return clientOrder(flightTypes).map(flightType => {
    if (typeof flightType !== 'string' || flightType === '') {
      throw configError(project, env, 'enabledFlightTypes', `contains a non-string entry: ${JSON.stringify(flightType)}`);
    }
    return flightType;
  });
}

function buildLoginForm(project, env, merged) {
  const loginForm = hasOwn(merged, 'loginForm') ? merged.loginForm : defaultConf.loginForm;
  if (typeof loginForm !== 'string' || loginForm === '') {
    throw configError(project, env, 'loginForm', `must be a non-empty string: ${JSON.stringify(loginForm)}`);
  }
  return loginForm;
}

function buildAerodrome(project, env, aerodrome, field = 'aerodrome') {
  if (!isPlainObject(aerodrome)) {
    throw configError(project, env, field, 'must be an object');
  }
  if (typeof aerodrome.ICAO !== 'string' || !ICAO_RE.test(aerodrome.ICAO)) {
    throw configError(project, env, `${field}.ICAO`, `must match ${ICAO_RE}: ${JSON.stringify(aerodrome.ICAO)}`);
  }
  return {
    ICAO: aerodrome.ICAO,
    runways: buildRunways(project, env, aerodrome.runways),
    departureRoutes: buildRoutes(project, env, aerodrome.departureRoutes, `${field}.departureRoutes`),
    arrivalRoutes: buildRoutes(project, env, aerodrome.arrivalRoutes, `${field}.arrivalRoutes`)
  };
}

// What the movement rules read from the aerodrome: ICAO (circuits), runway
// and route names (as sets, order does not matter to the rules).
const movementRuleView = aerodrome => JSON.stringify({
  ICAO: aerodrome.ICAO,
  runways: aerodrome.runways.map(({ name }) => name).sort(),
  departureRoutes: aerodrome.departureRoutes.map(({ name }) => name).sort(),
  arrivalRoutes: aerodrome.arrivalRoutes.map(({ name }) => name).sort()
});

// The database rules are built from the top-level aerodrome only. With
// movement writes through the API, an environment-level aerodrome must not
// change what the movement rules read, or the API would accept runways or
// routes the rules reject (and the other way round).
function assertMovementAerodromeMatchesRules(project, env, conf, aerodrome) {
  if (!hasOwn(conf.environments[env], 'aerodrome')) {
    return;
  }
  const topLevel = buildAerodrome(project, env, conf.aerodrome);
  if (movementRuleView(topLevel) !== movementRuleView(aerodrome)) {
    throw configError(project, env, `environments.${env}.aerodrome`,
      'must not change ICAO, runway or route names while movementWritesViaApi is on: '
      + 'the database rules read them from the top level only');
  }
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

  const { firebaseProjectId } = merged;
  if (typeof firebaseProjectId !== 'string' || firebaseProjectId === '') {
    throw configError(project, env, 'firebaseProjectId', `must be a non-empty string: ${JSON.stringify(firebaseProjectId)}`);
  }
  const aerodrome = buildAerodrome(project, env, merged.aerodrome);
  const movementWritesViaApi = readFlag(project, env, merged, 'movementWritesViaApi');
  if (movementWritesViaApi) {
    assertMovementAerodromeMatchesRules(project, env, conf, aerodrome);
  }

  return {
    project,
    env,
    firebaseProjectId,
    reportApiEnabled: readFlag(project, env, merged, 'reportApiEnabled'),
    mcpEnabled: readFlag(project, env, merged, 'mcpEnabled'),
    memberManagement: readFlag(project, env, merged, 'memberManagement'),
    movementWritesViaApi,
    lockOnDateTime: readFlag(project, env, merged, 'lockOnDateTime'),
    loginForm: buildLoginForm(project, env, merged),
    enabledFlightTypes: buildFlightTypes(project, env, merged),
    // Not per project: the list the database rules accept (aircraftCategory).
    aircraftCategories: aircraftCategoriesData.map(category => category.name),
    aerodrome
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
