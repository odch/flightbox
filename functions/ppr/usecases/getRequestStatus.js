'use strict'

const { statusTokenHashes, toPublicStatus } = require('../domain/pprStatusLink')

/**
 * The status of a request for the holder of its status link, without
 * personal data (see toPublicStatus). A missing request and a wrong token
 * are the same NOT_FOUND, so a link tells nothing about other requests.
 *
 * @param {Object} deps - { repository, statusTokens }
 * @param {string} key - PPR request key
 * @param {string} token - The token of the link
 * @returns {Promise<Object>}
 */
async function getRequestStatus({ repository, statusTokens }, key, token) {
  const request = await repository.findByKey(key)
  if (!request || !statusTokens.matches(token, statusTokenHashes(request))) {
    const err = new Error('PPR request not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  return toPublicStatus(request)
}

module.exports = getRequestStatus
