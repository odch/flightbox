'use strict';

const { getDatabase } = require('firebase-admin/database');
const logger = require('firebase-functions/logger');
const { SCOPES } = require('../apiKeys/scopes');
const { createApiKey, listApiKeys, revokeApiKey } = require('../apiKeys/store');

// Admin endpoints to manage the API keys of external programs.
const PATHS = ['/v1/api-keys', '/api/v1/api-keys'];
const ID_PATHS = PATHS.map(path => `${path}/:id`);

const MAX_NAME_LENGTH = 60;
const EXPIRY_MONTHS = [3, 6, 12, 24];

class InvalidRequest extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
  }
}

// Same time of day, months later; at the end of a shorter month the
// expiry is its last day (31 Aug + 6 months -> 28 Feb), never the next month.
function addMonths(ms, months) {
  const date = new Date(ms);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.getTime();
}

// Body of POST: {name, scopes, expiresInMonths (3|6|12|24|null),
// confirmPersonalData}.
function parseCreateRequest(body, availableScopes) {
  const { name, scopes, expiresInMonths, confirmPersonalData } = body || {};

  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (trimmed === '' || trimmed.length > MAX_NAME_LENGTH) {
    throw new InvalidRequest('name', `name must have 1 to ${MAX_NAME_LENGTH} characters`);
  }
  if (!Array.isArray(scopes) || scopes.length === 0
    || !scopes.every(scope => availableScopes.includes(scope))
    || new Set(scopes).size !== scopes.length) {
    throw new InvalidRequest('scopes', `scopes must be a non-empty list of: ${availableScopes.join(', ')}`);
  }
  if (scopes.includes(SCOPES.REPORTS_AIRSTAT_INTERNAL)) {
    if (!scopes.includes(SCOPES.REPORTS_AIRSTAT)) {
      throw new InvalidRequest('scopes', `${SCOPES.REPORTS_AIRSTAT_INTERNAL} requires ${SCOPES.REPORTS_AIRSTAT}`);
    }
    if (confirmPersonalData !== true) {
      throw new InvalidRequest('confirmPersonalData', 'Keys with personal data must be confirmed');
    }
  }
  if (expiresInMonths !== null && !EXPIRY_MONTHS.includes(expiresInMonths)) {
    throw new InvalidRequest('expiresInMonths', `expiresInMonths must be one of ${EXPIRY_MONTHS.join(', ')} or null`);
  }
  return { name: trimmed, scopes, expiresInMonths };
}

// `auth` must allow admins only.
function registerApiKeyRoutes(app, { availableScopes, auth, db = getDatabase, now = Date.now }) {
  app.get(PATHS, auth, async (req, res) => {
    try {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send({ availableScopes, keys: await listApiKeys(db()) });
    } catch (e) {
      logger.error('Failed to list API keys', e);
      return res.status(500).send({ error: 'internal_error' });
    }
  });

  app.post(PATHS, auth, async (req, res) => {
    let request;
    try {
      request = parseCreateRequest(req.body, availableScopes);
    } catch (e) {
      return res.status(400).send({ error: 'invalid_request', field: e.field, message: e.message });
    }
    try {
      const created = now();
      const { key, apiKey } = await createApiKey(db(), {
        name: request.name,
        scopes: request.scopes,
        expiresAt: request.expiresInMonths === null ? null : addMonths(created, request.expiresInMonths),
        createdBy: { uid: req.fbUserId, email: req.fbUserEmail || null },
      }, created);
      logger.info('API key created', { id: apiKey.id, uid: req.fbUserId, scopes: apiKey.scopes, expiresAt: apiKey.expiresAt });
      res.setHeader('Cache-Control', 'no-store');
      return res.status(201).send({ key, apiKey });
    } catch (e) {
      logger.error('Failed to create API key', e);
      return res.status(500).send({ error: 'internal_error' });
    }
  });

  app.delete(ID_PATHS, auth, async (req, res) => {
    try {
      await revokeApiKey(db(), req.params.id);
      logger.info('API key revoked', { id: req.params.id, uid: req.fbUserId });
      return res.status(204).send();
    } catch (e) {
      logger.error('Failed to revoke API key', e);
      return res.status(500).send({ error: 'internal_error' });
    }
  });
}

module.exports = { PATHS, ID_PATHS, addMonths, parseCreateRequest, registerApiKeyRoutes };
