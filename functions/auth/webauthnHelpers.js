'use strict';

const admin = require('firebase-admin');
const crypto = require('crypto');

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// Secret used to derive decoy passkey credentials (see generateDecoyCredentials).
// Prefer a configured secret so decoys stay stable across instances; fall back
// to a per-instance random secret so they remain unpredictable even when unset.
const DECOY_SECRET = process.env.WEBAUTHN_DECOY_SECRET
  || crypto.randomBytes(32).toString('hex');

// Returns a deterministic, unpredictable decoy allowCredentials list for an
// email that has no real passkeys. The authentication-options endpoint uses it
// so its response is indistinguishable between enrolled and non-enrolled
// addresses, preventing passkey-enrollment enumeration. The value is keyed by a
// server secret, so an attacker cannot recompute it to tell decoys from real
// credentials, and it is stable per email so repeated probes do not reveal the
// difference through changing responses.
function generateDecoyCredentials(email) {
  const normalized = typeof email === 'string' ? email.toLowerCase() : '';
  const id = crypto
    .createHmac('sha256', DECOY_SECRET)
    .update(`webauthn-decoy:${normalized}`)
    .digest('base64url');
  return [{ id, transports: ['internal'] }];
}

function getRpConfig() {
  const rpID = process.env.WEBAUTHN_RPID;
  const rpName = process.env.WEBAUTHN_RPNAME || 'Flightbox';
  const originsRaw = process.env.WEBAUTHN_ORIGINS;
  const expectedOrigins = typeof originsRaw === 'string'
    ? originsRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  if (!rpID || expectedOrigins.length === 0) {
    throw new Error('WebAuthn RP config missing: WEBAUTHN_RPID and WEBAUTHN_ORIGINS env vars must be set');
  }
  return { rpID, rpName, expectedOrigins };
}

function generateChallengeKey() {
  return crypto.randomBytes(24).toString('base64url');
}

async function persistChallenge({ type, challenge, uid, email }) {
  const key = generateChallengeKey();
  const expiry = Date.now() + CHALLENGE_TTL_MS;
  const record = {
    type,
    challenge,
    expiry,
    uid: uid || null,
    email: email || null,
    attempts: 0,
  };
  await admin.database().ref('/webauthnChallenges').child(key).set(record);
  return key;
}

async function consumeChallenge(key, expectedType) {
  if (!key || typeof key !== 'string') {
    throw new Error('Invalid challenge key');
  }
  const ref = admin.database().ref('/webauthnChallenges').child(key);
  let claimed = null;
  // RTDB transactions call the update function with the locally cached value
  // first (often null). Returning undefined aborts without refetching, so we
  // must return null — Firebase will detect the server mismatch and retry
  // with the real record.
  const result = await ref.transaction(current => {
    if (current === null || current === undefined) {
      return null;
    }
    claimed = current;
    return null;
  });
  if (!result.committed || !claimed) {
    throw new Error('Challenge not found');
  }
  if (claimed.type !== expectedType) {
    throw new Error('Challenge type mismatch');
  }
  if (typeof claimed.expiry !== 'number' || claimed.expiry <= Date.now()) {
    throw new Error('Challenge expired');
  }
  return claimed;
}

async function verifyAuthenticatedUser(req) {
  const header = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (!header || typeof header !== 'string') {
    throw new AuthError('Missing Authorization header');
  }
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new AuthError('Malformed Authorization header');
  }
  const token = match[1].trim();
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(token, true);
  } catch (e) {
    throw new AuthError('Invalid ID token');
  }
  if (!decoded || !decoded.uid) {
    throw new AuthError('Invalid ID token');
  }
  return { uid: decoded.uid, email: decoded.email || null };
}

class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

module.exports = {
  CHALLENGE_TTL_MS,
  AuthError,
  getRpConfig,
  generateChallengeKey,
  generateDecoyCredentials,
  persistChallenge,
  consumeChallenge,
  verifyAuthenticatedUser,
};
