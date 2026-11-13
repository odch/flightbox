'use strict'

const {
  Status,
  canBeRevoked,
  sanitizeReviewRemarks,
  invalid
} = require('../domain/pprRequest')

/**
 * Revoke an approval, e.g. after a closure came up. The pilot gets the
 * reason by email. Only approved requests can be revoked; the check and the
 * write are one atomic step in the repository.
 *
 * @param {Object} deps - { repository, notifier }
 * @param {string} key - PPR request key
 * @param {Object} revocation - { reviewedBy, reviewedAt, reviewRemarks }
 * @returns {Promise<void>}
 */
async function revokeApproval({ repository, notifier }, key, revocation) {
  const reviewRemarks = sanitizeReviewRemarks(revocation.reviewRemarks)
  if (!reviewRemarks) {
    throw invalid('A reason is needed to revoke an approval')
  }

  const { applied, request } = await repository.updateIf(key, canBeRevoked, {
    status: Status.REVOKED,
    reviewedBy: revocation.reviewedBy,
    reviewedAt: revocation.reviewedAt,
    reviewRemarks
  })

  if (!request) {
    const err = new Error('PPR request not found')
    err.code = 'NOT_FOUND'
    throw err
  }

  if (!applied) {
    const err = new Error('Only approved requests can be revoked')
    err.code = 'NOT_APPROVED'
    throw err
  }

  try {
    await notifier.notifyRequestReviewed({ ...request, key })
  } catch (e) {
    console.error('Failed to send PPR revocation for request', key)
  }
}

module.exports = revokeApproval
