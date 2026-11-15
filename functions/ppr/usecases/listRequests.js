'use strict'

const { withoutStatusTokens } = require('../domain/pprStatusLink')

/**
 * List PPR requests: all of them for the admin list (isAdmin), otherwise
 * the requests created with the given email. The hashes of the status links
 * are left out.
 *
 * @param {Object} deps - { repository }
 * @param {Object} params - { email, isAdmin }
 * @returns {Promise<Array<Object>>}
 */
async function listRequests({ repository }, { email, isAdmin }) {
  const requests = isAdmin ? await repository.findAll() : await repository.findByEmail(email)
  return requests.map(withoutStatusTokens)
}

module.exports = listRequests
