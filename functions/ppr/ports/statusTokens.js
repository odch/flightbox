'use strict'

/**
 * Status Tokens Port
 *
 * The secrets in the pilot's links to the status of a request. A request
 * stores only their hashes (domain/pprStatusLink.js).
 * Implementations: cryptoStatusTokens (current).
 *
 * @typedef {Object} StatusTokens
 * @property {function(): {token: string, hash: string}} create
 *   A new random token (STATUS_TOKEN_PATTERN) and the hash to store.
 * @property {function(string, Array<string>): boolean} matches
 *   Whether the token is one of those with the given hashes.
 */

module.exports = {}
