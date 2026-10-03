'use strict';

const { getDatabase } = require('firebase-admin/database');
const logger = require('firebase-functions/logger');
const { fbAdminAuth } = require('./fbAuth');
const { KEY_PREFIX } = require('../apiKeys/keys');
const { useApiKey } = require('../apiKeys/store');

// Query parameter names that suggest a credential.
const CREDENTIAL_PARAMS = ['key', 'apikey', 'api_key', 'token', 'access_token', 'authorization'];

// A key in the URL ends up in logs and browser histories. It is rejected so
// the caller moves it to the header; the key itself stays valid.
function credentialsInUrl(query) {
  return Object.entries(query || {}).some(([name, value]) =>
    CREDENTIAL_PARAMS.includes(name.toLowerCase())
    || name.includes(KEY_PREFIX)
    || [].concat(value).some(item => typeof item === 'string' && item.includes(KEY_PREFIX)));
}

// The token of an `Authorization: Bearer <token>` header; the scheme is
// case-insensitive (RFC 7235).
function bearerToken(header) {
  const match = /^bearer\s+(\S+)\s*$/i.exec(header || '');
  return match ? match[1] : null;
}

/**
 * For routes that external programs call with an API key
 * (Authorization: Bearer fbx_...) and admins with their Firebase ID token.
 * A key needs `scope`; on success req.apiKey is {id, name, scopes}. Admins
 * have every scope and go through fbAdminAuth.
 */
function apiKeyOrAdminAuth(scope, { db = getDatabase, now = Date.now } = {}) {
  return async (req, res, next) => {
    if (credentialsInUrl(req.query)) {
      return res.status(400).send({
        error: 'credentials_in_url',
        message: 'Send the API key in the Authorization header, not in the URL',
      });
    }

    const token = bearerToken(req.headers.authorization);
    if (token === null || !token.startsWith(KEY_PREFIX)) {
      return fbAdminAuth(req, res, next);
    }

    let result;
    try {
      result = await useApiKey(db(), token, now());
    } catch (e) {
      logger.error('API key check failed', e);
      return res.status(500).send({ error: 'internal_error' });
    }

    if (result.error === 'rate_limited') {
      res.setHeader('Retry-After', String(result.retryAfterSeconds));
      return res.status(429).send({ error: 'rate_limited', message: 'Daily request limit of this API key reached' });
    }
    if (result.error) {
      res.setHeader('WWW-Authenticate', 'Bearer error="invalid_token"');
      return res.status(401).send({ error: result.error });
    }
    if (!result.apiKey.scopes.includes(scope)) {
      return res.status(403).send({ error: 'insufficient_scope', scope });
    }
    req.apiKey = result.apiKey;
    return next();
  };
}

module.exports = { apiKeyOrAdminAuth, credentialsInUrl };
