'use strict'

const {
  Status,
  canBeRevoked,
  sanitizeReviewRemarks,
  invalid
} = require('../domain/pprRequest')
const { withStatusToken } = require('../domain/pprStatusLink')

/**
 * Revoke an approval, e.g. after a closure came up. The pilot gets the
 * reason by email. Only approved requests can be revoked; the check and the
 * write are one atomic step in the repository, which also stores the hash of
 * the token the email links with.
 *
 * @param {Object} deps - { repository, notifier, statusTokens }
 * @param {string} key - PPR request key
 * @param {Object} revocation - { reviewedBy, reviewedAt, reviewRemarks }
 * @returns {Promise<void>}
 */
async function revokeApproval({ repository, notifier, statusTokens }, key, revocation) {
  const reviewRemarks = sanitizeReviewRemarks(revocation.reviewRemarks)
  if (!reviewRemarks) {
    throw invalid('A reason is needed to revoke an approval')
  }

  const { token, hash } = statusTokens.create()
  const { applied, request } = await repository.updateIf(key, canBeRevoked, current => ({
    status: Status.REVOKED,
    reviewedBy: revocation.reviewedBy,
    reviewedAt: revocation.reviewedAt,
    reviewRemarks,
    statusTokens: withStatusToken(current, hash, revocation.reviewedAt)
  }))

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
    await notifier.notifyRequestReviewed({ ...request, key }, token)
  } catch (e) {
    console.error('Failed to send PPR revocation for request', key)
  }
}

module.exports = revokeApproval
