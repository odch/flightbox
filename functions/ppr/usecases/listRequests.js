'use strict'

/**
 * List PPR requests.
 * Admins see all requests, pilots see only their own.
 *
 * @param {Object} deps - { repository }
 * @param {Object} params - { email, isAdmin }
 * @returns {Promise<Array<Object>>}
 */
async function listRequests({ repository }, { email, isAdmin }) {
  if (isAdmin) {
    return repository.findAll()
  }
  return repository.findByEmail(email)
}

module.exports = listRequests
