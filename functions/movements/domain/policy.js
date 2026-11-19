'use strict';

// The tenant policy for movement writes, built from the functions config
// (functions/project-config.generated.json, see tasks/generateServerConfig.js).
// It carries exactly what tasks/processFirebaseRules.js bakes into the
// database rules of the project: the allowed runways, routes, flight types and
// aircraft categories, the aerodrome ICAO (for 'circuits'), whether movements
// are owner-scoped (loginForm 'email') and which movement lock applies.

function policyError(field, problem) {
  return new TypeError(`Invalid movement policy config: ${field} ${problem}`);
}

function names(list, field) {
  if (!Array.isArray(list)) {
    throw policyError(field, 'must be an array');
  }
  return Object.freeze(list.map(entry => {
    if (entry === null || typeof entry !== 'object' || typeof entry.name !== 'string') {
      throw policyError(field, `has an entry without a name: ${JSON.stringify(entry)}`);
    }
    return entry.name;
  }));
}

function strings(list, field) {
  if (!Array.isArray(list) || !list.every(item => typeof item === 'string')) {
    throw policyError(field, 'must be an array of strings');
  }
  return Object.freeze([...list]);
}

/**
 * Pure. Throws a TypeError when the config lacks a field the policy needs
 * (e.g. a config generated before these fields existed).
 */
function buildMovementPolicy(config) {
  if (config === null || typeof config !== 'object') {
    throw policyError('config', 'must be an object');
  }
  const { aerodrome } = config;
  if (aerodrome === null || typeof aerodrome !== 'object') {
    throw policyError('aerodrome', 'must be an object');
  }
  if (typeof aerodrome.ICAO !== 'string' || aerodrome.ICAO === '') {
    throw policyError('aerodrome.ICAO', 'must be a non-empty string');
  }
  if (typeof config.loginForm !== 'string') {
    throw policyError('loginForm', 'must be a string');
  }
  if (typeof config.lockOnDateTime !== 'boolean') {
    throw policyError('lockOnDateTime', 'must be a boolean');
  }
  return Object.freeze({
    icao: aerodrome.ICAO,
    runways: names(aerodrome.runways, 'aerodrome.runways'),
    departureRoutes: names(aerodrome.departureRoutes, 'aerodrome.departureRoutes'),
    arrivalRoutes: names(aerodrome.arrivalRoutes, 'aerodrome.arrivalRoutes'),
    flightTypes: strings(config.enabledFlightTypes, 'enabledFlightTypes'),
    aircraftCategories: strings(config.aircraftCategories, 'aircraftCategories'),
    // Personal access: pilots write only their own movements, guest/kiosk only
    // ownerless ones (processFirebaseRules.js processMovementOwnership).
    personalAccess: config.loginForm === 'email',
    lockOnDateTime: config.lockOnDateTime,
  });
}

module.exports = { buildMovementPolicy };
