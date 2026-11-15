'use strict'

const crypto = require('crypto')

const HASH_PATTERN = /^[0-9a-f]{64}$/

// Tokens have 256 random bits, so only a SHA-256 hash of them is stored; a
// slow hash is not needed for random secrets (as for the API keys,
// functions/apiKeys/keys.js).
function hash(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

// 43 characters of base64url: they need no escaping in a URL path
function create() {
  const token = crypto.randomBytes(32).toString('base64url')
  return { token, hash: hash(token) }
}

// Compared in constant time; a malformed stored hash matches nothing
function matches(token, hashes) {
  const computed = Buffer.from(hash(token), 'hex')
  return hashes.some(stored => typeof stored === 'string' && HASH_PATTERN.test(stored) &&
    crypto.timingSafeEqual(Buffer.from(stored, 'hex'), computed))
}

module.exports = { create, matches }
