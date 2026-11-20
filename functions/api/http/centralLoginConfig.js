'use strict';

// Validation of the `centralLogin` project config (see loginTokens.js).
// Without dependencies: tasks/generateServerConfig.js loads it at deploy
// time, outside the functions' node_modules.

const AUDIENCE = /^[a-z0-9][a-z0-9-]{1,62}$/;

function isHttpsUrl(value, { allowPath }) {
  let url;
  try {
    url = new URL(value);
  } catch (e) {
    return false;
  }
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  return (url.protocol === 'https:' || (url.protocol === 'http:' && isLocal))
    && !url.search && !url.hash && !url.username && !url.password
    && (allowPath || url.href === `${url.origin}/`);
}

/**
 * Returns `config` when it is a valid centralLogin config
 * ({issuer, jwksUri, audience}), else throws a TypeError naming the problem.
 */
function validateCentralLogin(config) {
  if (config === null || typeof config !== 'object' || Array.isArray(config)) {
    throw new TypeError('must be an object');
  }
  const keys = Object.keys(config).sort().join();
  if (keys !== 'audience,issuer,jwksUri') {
    throw new TypeError('must have exactly issuer, jwksUri and audience');
  }
  if (typeof config.issuer !== 'string' || !isHttpsUrl(config.issuer, { allowPath: false }) || config.issuer.endsWith('/')) {
    throw new TypeError('issuer must be an https origin without a trailing slash');
  }
  if (typeof config.jwksUri !== 'string' || !isHttpsUrl(config.jwksUri, { allowPath: true })) {
    throw new TypeError('jwksUri must be an https URL');
  }
  if (typeof config.audience !== 'string' || !AUDIENCE.test(config.audience)) {
    throw new TypeError(`audience must match ${AUDIENCE}`);
  }
  return config;
}

module.exports = { validateCentralLogin };
