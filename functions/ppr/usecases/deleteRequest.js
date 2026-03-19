'use strict'

/**
 * Delete a PPR request.
 * Only the pilot who created the request can delete it.
 *
 * @param {Object} deps - { repository }
 * @param {string} key - PPR request key
 * @param {string} email - Email of the requesting user
 * @returns {Promise<void>}
 */
async function deleteRequest({ repository }, key, email) {
  const existing = await repository.findByKey(key)
  if (!existing) {
    const err = new Error('PPR request not found')
    err.code = 'NOT_FOUND'
    throw err
  }

  if (existing.createdBy !== email) {
    const err = new Error('Not authorized to delete this request')
    err.code = 'FORBIDDEN'
    throw err
  }

  await repository.deleteByKey(key)
}

module.exports = deleteRequest
