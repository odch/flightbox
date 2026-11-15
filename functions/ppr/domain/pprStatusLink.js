'use strict'

const { AUTOMATIC_REVIEWER, canBeWithdrawn } = require('./pprRequest')

// The secret in a pilot's link to the status of a request: 256 random bits
// in base64url (adapters/cryptoStatusTokens.js). The routes refuse other
// tokens, and the emails link only to such tokens.
const STATUS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

// A request stores only the hashes of the tokens its emails carry, with the
// time each one was issued ({ <hash>: <ms> }): every email with a link gets a
// token of its own, as a stored hash cannot be turned back into a token.
function statusTokenHashes(request) {
  return isPlainObject(request.statusTokens) ? Object.keys(request.statusTokens) : []
}

function withStatusToken(request, hash, issuedAt) {
  const tokens = isPlainObject(request.statusTokens) ? request.statusTokens : {}
  return { ...tokens, [hash]: issuedAt }
}

// For the lists in the app: the hashes stay on the server
function withoutStatusTokens(request) {
  const { statusTokens, ...rest } = request
  return rest
}

// What a status link shows. Whoever holds the link sees it, and the address
// of a request without login may be mistyped, so it has no personal data:
// only the flight and the aerodrome's answer.
function toPublicStatus(request) {
  return {
    status: request.status,
    immatriculation: request.immatriculation,
    plannedDate: request.plannedDate,
    plannedTime: request.plannedTime,
    flightType: request.flightType,
    ...(request.reviewRemarks ? { reviewRemarks: request.reviewRemarks } : {}),
    automatic: request.reviewedBy === AUTOMATIC_REVIEWER,
    canWithdraw: canBeWithdrawn(request)
  }
}

module.exports = {
  STATUS_TOKEN_PATTERN,
  statusTokenHashes,
  withStatusToken,
  withoutStatusTokens,
  toPublicStatus
}
