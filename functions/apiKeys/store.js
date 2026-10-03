'use strict';

const { generateKey, parseKey, hashSecret, sameHash, ID_PATTERN } = require('./keys');

// API keys live in /apiKeys/<id>, which only the functions can read and
// write (see firebase-rules-template.json):
// { name, scopes, hash, createdAt, createdBy: {uid, email}, expiresAt,
//   lastUsedAt, usage: {day, count} }
const KEYS_PATH = '/apiKeys';
const DAILY_LIMIT = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

// What admins see of a key: never the hash.
function toPublic(id, record) {
  return {
    id,
    name: record.name,
    scopes: record.scopes || [],
    createdAt: record.createdAt,
    createdBy: (record.createdBy && record.createdBy.email) || null,
    expiresAt: record.expiresAt || null,
    lastUsedAt: record.lastUsedAt || null,
  };
}

// Returns the plaintext key once; only its hash is stored.
async function createApiKey(db, { name, scopes, expiresAt, createdBy }, now) {
  const { id, secret, key } = generateKey();
  const record = {
    name,
    scopes,
    hash: hashSecret(secret),
    createdAt: now,
    createdBy,
    expiresAt: expiresAt || null,
  };
  await db.ref(`${KEYS_PATH}/${id}`).set(record);
  return { key, apiKey: toPublic(id, record) };
}

// Newest first.
async function listApiKeys(db) {
  const snapshot = await db.ref(KEYS_PATH).once('value');
  const keys = [];
  snapshot.forEach(child => {
    keys.push(toPublic(child.key, child.val()));
  });
  return keys.sort((a, b) => b.createdAt - a.createdAt);
}

async function revokeApiKey(db, id) {
  if (typeof id === 'string' && ID_PATTERN.test(id)) {
    await db.ref(`${KEYS_PATH}/${id}`).remove();
  }
}

/**
 * Checks a key presented by a caller and counts the request against the
 * key's daily limit (UTC days). Returns {apiKey: {id, name, scopes}} or
 * {error} with error 'invalid_api_key', 'key_expired' or 'rate_limited'
 * (then also retryAfterSeconds). Unknown, revoked and wrong keys all give
 * 'invalid_api_key'.
 */
async function useApiKey(db, key, now) {
  const parsed = parseKey(key);
  if (!parsed) {
    return { error: 'invalid_api_key' };
  }
  const hash = hashSecret(parsed.secret);
  const day = new Date(now).toISOString().slice(0, 10);

  // Checking and counting in one transaction means a key revoked meanwhile
  // is never brought back by the usage write. `outcome` is set by the last
  // run of the update function, which is the one that decided.
  let outcome;
  let result;
  try {
    result = await db.ref(`${KEYS_PATH}/${parsed.id}`).transaction(current => {
      if (current === null) {
        // No such key, or nothing cached yet: the database retries with the
        // stored value if there is one.
        outcome = 'invalid_api_key';
        return null;
      }
      if (!sameHash(current.hash, hash)) {
        outcome = 'invalid_api_key';
        return undefined;
      }
      if (current.expiresAt && now >= current.expiresAt) {
        outcome = 'key_expired';
        return undefined;
      }
      const count = current.usage && current.usage.day === day ? current.usage.count : 0;
      if (count >= DAILY_LIMIT) {
        outcome = 'rate_limited';
        return undefined;
      }
      outcome = 'ok';
      return { ...current, lastUsedAt: now, usage: { day, count: count + 1 } };
    }, undefined, false);
  } catch (e) {
    // The Admin SDK aborts a running transaction with Error('set') when the
    // path is written meanwhile: the key was revoked.
    if (e && e.message === 'set') {
      return { error: 'invalid_api_key' };
    }
    throw e;
  }
  const { committed, snapshot } = result;

  if (outcome === 'ok' && committed && snapshot.exists()) {
    const record = snapshot.val();
    return { apiKey: { id: parsed.id, name: record.name, scopes: record.scopes || [] } };
  }
  if (outcome === 'rate_limited') {
    const nextDay = Math.floor(now / DAY_MS) * DAY_MS + DAY_MS;
    return { error: outcome, retryAfterSeconds: Math.ceil((nextDay - now) / 1000) };
  }
  return { error: outcome === 'key_expired' ? outcome : 'invalid_api_key' };
}

module.exports = { DAILY_LIMIT, createApiKey, listApiKeys, revokeApiKey, useApiKey };
