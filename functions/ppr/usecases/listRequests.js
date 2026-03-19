'use strict'

/**
 * List PPR requests: all of them for the admin list (isAdmin), otherwise
 * the requests created with the given email.
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
