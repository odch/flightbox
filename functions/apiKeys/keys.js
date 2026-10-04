'use strict';

const crypto = require('crypto');

// Keys look like fbx_<id>_<secret>: the id (72 random bits) finds the stored
// key, the secret (256 random bits) proves it. Only a SHA-256 hash of the
// secret is stored; a slow hash is not needed for random secrets.
const KEY_PREFIX = 'fbx_';
const KEY_PATTERN = /^fbx_([A-Za-z0-9_-]{12})_([A-Za-z0-9_-]{43})$/;
const ID_PATTERN = /^[A-Za-z0-9_-]{12}$/;
const HASH_PATTERN = /^[0-9a-f]{64}$/;

function generateKey() {
  const id = crypto.randomBytes(9).toString('base64url');
  const secret = crypto.randomBytes(32).toString('base64url');
  return { id, secret, key: `${KEY_PREFIX}${id}_${secret}` };
}

// { id, secret } of a well-formed key, otherwise null.
function parseKey(key) {
  const match = typeof key === 'string' ? KEY_PATTERN.exec(key) : null;
  return match ? { id: match[1], secret: match[2] } : null;
}

function hashSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

// Constant-time comparison of a stored hash with a computed one.
function sameHash(stored, computed) {
  if (typeof stored !== 'string' || !HASH_PATTERN.test(stored)) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(stored, 'hex'), Buffer.from(computed, 'hex'));
}

module.exports = { KEY_PREFIX, ID_PATTERN, generateKey, parseKey, hashSecret, sameHash };
