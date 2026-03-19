'use strict'

const { canBeDeletedBy } = require('../domain/pprRequest')

/**
 * Delete a PPR request: only the pilot who created it, and only while it is
 * pending. The checks and the delete are one atomic step in the repository,
 * so a request cannot be deleted while it is being reviewed.
 *
 * @param {Object} deps - { repository }
 * @param {string} key - PPR request key
 * @param {string} email - Email of the requesting user
 * @returns {Promise<void>}
 */
async function deleteRequest({ repository }, key, email) {
  const { applied, request } = await repository.removeIf(key, existing => canBeDeletedBy(existing, email))
  if (applied) {
    return
  }

  if (!request) {
    const err = new Error('PPR request not found')
    err.code = 'NOT_FOUND'
    throw err
  }

  if (request.createdBy !== email) {
    const err = new Error('Not authorized to delete this request')
    err.code = 'FORBIDDEN'
    throw err
  }

  const err = new Error('Only pending requests can be deleted')
  err.code = 'NOT_PENDING'
  throw err
}

module.exports = deleteRequest
