'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('firebase-functions/logger');
const { validateCentralLogin } = require('./centralLoginConfig');

// Access tokens of the central login (Open Digital account, odch/odch-login)
// as an alternative to Firebase ID tokens, for the app API routes. Only
// where the project config sets `centralLogin` (tasks/generateServerConfig.js):
//
//   centralLogin: { issuer, jwksUri, audience }
//
// The hub (odch/mcp-hub) obtains such tokens by token exchange (RFC 8693)
// for exactly this instance: a JWT (RFC 9068, typ at+jwt) signed with ES256,
// iss = issuer, aud = audience (e.g. "flightbox-lsze-test"), with the
// pilot's verified e-mail and the movements:write and/or movements:read
// scope; the routes check the one they need (appAuth.js requireScope).

const ALGORITHMS = ['ES256'];
const TOKEN_TYPES = new Set(['at+jwt', 'application/at+jwt']);
const MOVEMENT_SCOPES = Object.freeze(['movements:write', 'movements:read']);
const CLOCK_TOLERANCE_SECONDS = 30;
// The login issues these tokens for 5 minutes; anything longer lived is not
// one of them.
const MAX_LIFETIME_SECONDS = 60 * 60;
const SUBJECT = /^[A-Za-z0-9-]{1,128}$/;

const KEYS_MAX_AGE_MS = 10 * 60 * 1000;
// An unknown kid triggers a refetch (key rotation), at most this often.
const REFETCH_COOLDOWN_MS = 30 * 1000;
const FETCH_TIMEOUT_MS = 5000;

// The token itself is not acceptable: answered 401. Every other error (keys
// not reachable) is an infrastructure fault: answered 500.
class LoginTokenRejected extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'LoginTokenRejected';
  }
}

const reject = reason => {
  throw new LoginTokenRejected(reason);
};

// The claims of a JWT without verifying it, only to see which issuer it
// claims to be from; null if it is no JWT.
function unverifiedIssuer(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload !== null && typeof payload === 'object' && typeof payload.iss === 'string' ? payload.iss : null;
  } catch (e) {
    return null;
  }
}

function toKeyObject(jwk) {
  const isSigningKey = jwk !== null && typeof jwk === 'object'
    && jwk.kty === 'EC' && jwk.crv === 'P-256'
    && typeof jwk.kid === 'string' && jwk.kid !== ''
    && (jwk.use === undefined || jwk.use === 'sig')
    && (jwk.alg === undefined || jwk.alg === 'ES256')
    && jwk.d === undefined;
  if (!isSigningKey) {
    return null;
  }
  try {
    return crypto.createPublicKey({ key: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y }, format: 'jwk' });
  } catch (e) {
    return null;
  }
}

/**
 * The login's signing keys by kid, from its JWKS. Cached for
 * KEYS_MAX_AGE_MS; an unknown kid refetches (rate limited). When a refetch
 * fails, keys fetched before keep working.
 */
function createKeySource({ jwksUri, fetchImpl, now }) {
  let keys = new Map();
  let fetchedAt = -Infinity;
  let pending = null;

  async function refetch() {
    let response;
    try {
      response = await fetchImpl(jwksUri, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (e) {
      throw new Error(`Fetching the login keys failed: ${e.name}: ${e.message}`);
    }
    if (!response.ok) {
      throw new Error(`Fetching the login keys answered ${response.status}`);
    }
    const body = await response.json();
    const next = new Map();
    (Array.isArray(body && body.keys) ? body.keys : []).forEach(jwk => {
      const key = toKeyObject(jwk);
      if (key) {
        next.set(jwk.kid, key);
      }
    });
    keys = next;
    fetchedAt = now();
  }

  function refetchOnce() {
    if (!pending) {
      pending = refetch().finally(() => {
        pending = null;
      });
    }
    return pending;
  }

  return async function getKey(kid) {
    const age = now() - fetchedAt;
    const stale = age >= KEYS_MAX_AGE_MS;
    if (stale || (!keys.has(kid) && age >= REFETCH_COOLDOWN_MS)) {
      try {
        await refetchOnce();
      } catch (error) {
        if (!keys.has(kid)) {
          throw error;
        }
        logger.warn('Using cached login keys, refetch failed', { error: error.message });
      }
    }
    return keys.get(kid) || null;
  };
}

/**
 * Returns null when `config` (the project config's centralLogin) is absent,
 * else a verifier with
 *  - isLoginToken(token): whether the token claims to be from the login
 *    (only then is verify() the right check for it);
 *  - verify(token): resolves with {sub, email} or rejects with
 *    LoginTokenRejected (bad token) or another error (keys not reachable).
 * An invalid config is logged and treated as absent, so it cannot break the
 * api function; the deploy already rejects it (generateServerConfig.js).
 */
function createLoginTokenVerifier(config, { fetchImpl = (...args) => fetch(...args), now = Date.now } = {}) {
  if (config === undefined || config === null) {
    return null;
  }
  try {
    validateCentralLogin(config);
  } catch (error) {
    logger.error(`Invalid centralLogin config, login tokens disabled: ${error.message}`);
    return null;
  }
  const { issuer, audience } = config;
  const getKey = createKeySource({ jwksUri: config.jwksUri, fetchImpl, now });

  async function verify(token) {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || typeof decoded.payload !== 'object' || decoded.payload === null) {
      reject('malformed');
    }
    const { header } = decoded;
    if (!ALGORITHMS.includes(header.alg)) {
      reject('algorithm');
    }
    if (typeof header.typ !== 'string' || !TOKEN_TYPES.has(header.typ.toLowerCase())) {
      reject('type');
    }
    if (typeof header.kid !== 'string' || header.kid === '') {
      reject('kid');
    }
    const key = await getKey(header.kid);
    if (!key) {
      reject('unknown key');
    }

    let payload;
    try {
      payload = jwt.verify(token, key, {
        algorithms: ALGORITHMS,
        issuer,
        audience,
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      });
    } catch (error) {
      reject(error.name === 'TokenExpiredError' ? 'expired' : `invalid: ${error.message}`);
    }

    const nowSeconds = Math.floor(now() / 1000);
    if (!Number.isInteger(payload.exp) || !Number.isInteger(payload.iat)
      || payload.exp - payload.iat > MAX_LIFETIME_SECONDS
      || payload.iat > nowSeconds + CLOCK_TOLERANCE_SECONDS) {
      reject('lifetime');
    }
    if (typeof payload.sub !== 'string' || !SUBJECT.test(payload.sub)) {
      reject('subject');
    }
    if (typeof payload.email !== 'string' || payload.email === '' || payload.email_verified !== true) {
      reject('no verified e-mail');
    }
    const scopes = (typeof payload.scope === 'string' ? payload.scope.split(' ') : [])
      .filter(scope => MOVEMENT_SCOPES.includes(scope));
    if (scopes.length === 0) {
      reject('scope');
    }
    // Lower-cased like Firebase Auth stores addresses, so a pilot owns the
    // same movements whichever way they signed in.
    return { sub: payload.sub, email: payload.email.toLowerCase(), scopes: [...new Set(scopes)] };
  }

  return {
    issuer,
    isLoginToken: token => unverifiedIssuer(token) === issuer,
    verify,
  };
}

module.exports = {
  MOVEMENT_SCOPES,
  createLoginTokenVerifier,
  validateCentralLogin,
  LoginTokenRejected,
};
