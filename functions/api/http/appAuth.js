'use strict';

const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const logger = require('firebase-functions/logger');
const { ApiError, sendError } = require('./errors');

// Shared sessions sign in with a fixed uid (functions/auth/modes).
const GUEST_UID = 'guest';
const KIOSK_UID = 'kiosk';

// Characters that are not allowed in a Realtime Database key.
const INVALID_KEY_CHARS = /[.#$[\]/]/;

// The token of an `Authorization: Bearer <token>` header; the scheme is
// case-insensitive (RFC 7235).
function bearerToken(header) {
  const match = /^bearer\s+(\S+)\s*$/i.exec(header || '');
  return match ? match[1] : null;
}

// Codes with which verifyIdToken rejects the token itself (malformed or
// forged, expired, revoked, disabled or deleted user). Every other error,
// e.g. auth/quota-exceeded or auth/insufficient-permission of the
// revocation lookup, is our problem and not the caller's.
const TOKEN_REJECTION_CODES = new Set([
  'auth/argument-error',
  'auth/id-token-expired',
  'auth/id-token-revoked',
  'auth/user-disabled',
  'auth/user-not-found',
]);

// firebase-admin also reports a failure to fetch Google's signing keys as
// auth/argument-error. Its message then starts with "Error fetching ..."
// (bad response) or "Error while making request: ..." (network failure).
const KEY_FETCH_FAILURE = /^Error (fetching|while making request)/;

function isKeyFetchFailure(error) {
  return (
    error.code === 'auth/argument-error' &&
    KEY_FETCH_FAILURE.test(String(error.message))
  );
}

function isTokenRejection(error) {
  return (
    Boolean(error) &&
    TOKEN_REJECTION_CODES.has(error.code) &&
    !isKeyFetchFailure(error)
  );
}

// Same check as the database rules: /admins/<uid> === true.
async function isAdmin(db, uid) {
  if (!uid || INVALID_KEY_CHARS.test(uid)) {
    return false;
  }
  const snapshot = await db.ref(`/admins/${uid}`).once('value');
  return snapshot.val() === true;
}

async function resolveActor(decodedToken, db) {
  const { uid } = decodedToken;
  return {
    uid,
    email: typeof decodedToken.email === 'string' ? decodedToken.email : null,
    isAdmin: await isAdmin(db, uid),
    isGuest: uid === GUEST_UID,
    isKiosk: uid === KIOSK_UID,
  };
}

function rejectUnauthenticated(req, res, message) {
  res.set('WWW-Authenticate', 'Bearer');
  sendError(req, res, new ApiError('unauthenticated', message));
}

async function verifyToken(auth, idToken) {
  try {
    return { decoded: await auth.verifyIdToken(idToken, true) };
  } catch (error) {
    if (isTokenRejection(error)) {
      return { rejection: error.code };
    }
    throw error;
  }
}

/**
 * Middleware for routes the web app calls with the user's Firebase ID token
 * (`Authorization: Bearer <idToken>`). Revoked tokens and disabled users are
 * rejected (checkRevoked). On success req.actor is
 * {uid, email|null, isAdmin, isGuest, isKiosk}. A missing or rejected
 * token is answered 401 in the error envelope; infrastructure faults
 * (signing keys or revocation lookup unavailable, failed admin lookup) are
 * logged and answered 500, so an outage does not look like a sign-out.
 */
function appAuth({ auth = getAuth, db = getDatabase } = {}) {
  return async (req, res, next) => {
    const idToken = bearerToken(req.get('Authorization'));
    if (!idToken) {
      return rejectUnauthenticated(req, res, 'Authentication required');
    }

    let actor;
    try {
      const { decoded, rejection } = await verifyToken(auth(), idToken);
      if (rejection) {
        logger.info('ID token rejected', {
          requestId: req.requestId,
          reason: rejection,
        });
        return rejectUnauthenticated(req, res, 'Invalid or expired ID token');
      }
      actor = await resolveActor(decoded, db());
    } catch (error) {
      return sendError(req, res, error);
    }

    req.actor = actor;
    return next();
  };
}

module.exports = { appAuth, resolveActor, bearerToken, GUEST_UID, KIOSK_UID };
