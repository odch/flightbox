'use strict'

const { canBeWithdrawn } = require('../domain/pprRequest')
const { statusTokenHashes } = require('../domain/pprStatusLink')

/**
 * Withdraw a pending request with its status link: it is deleted, like a
 * request the pilot deletes in the app, and the aerodrome gets no email. The
 * token check, the pending check and the delete are one atomic step in the
 * repository, so an answer cannot slip in between. A wrong token is
 * NOT_FOUND, as for a missing request.
 *
 * @param {Object} deps - { repository, statusTokens }
 * @param {string} key - PPR request key
 * @param {string} token - The token of the link
 * @returns {Promise<void>}
 */
async function withdrawRequest({ repository, statusTokens }, key, token) {
  const isLinked = request => statusTokens.matches(token, statusTokenHashes(request))

  const { applied, request } = await repository.removeIf(key, existing => isLinked(existing) && canBeWithdrawn(existing))
  if (applied) {
    return
  }

  if (!request || !isLinked(request)) {
    const err = new Error('PPR request not found')
    err.code = 'NOT_FOUND'
    throw err
  }

  const err = new Error('Only pending requests can be withdrawn')
  err.code = 'NOT_PENDING'
  throw err
}

module.exports = withdrawRequest
