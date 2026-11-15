'use strict'

const {
  validateReviewStatus,
  canBeReviewed,
  sanitizeReviewRemarks
} = require('../domain/pprRequest')
const { withStatusToken } = require('../domain/pprStatusLink')

/**
 * Review (approve/reject) a pending PPR request.
 *
 * The pending check and the write are one atomic step in the repository, so
 * a concurrent review or delete cannot slip in between. The same step stores
 * the hash of the token the pilot's email links with (a stored hash cannot
 * be sent again).
 *
 * @param {Object} deps - { repository, notifier, statusTokens }
 * @param {string} key - PPR request key
 * @param {Object} review - { status, reviewedBy, reviewedAt, reviewRemarks? }
 * @returns {Promise<void>}
 */
async function reviewRequest({ repository, notifier, statusTokens }, key, review) {
  validateReviewStatus(review.status)

  const reviewData = {
    status: review.status,
    reviewedBy: review.reviewedBy,
    reviewedAt: review.reviewedAt
  }

  if (review.reviewRemarks) {
    reviewData.reviewRemarks = sanitizeReviewRemarks(review.reviewRemarks)
  }

  const { token, hash } = statusTokens.create()
  const { applied, request } = await repository.updateIf(key, canBeReviewed, current => ({
    ...reviewData,
    statusTokens: withStatusToken(current, hash, review.reviewedAt)
  }))
  if (!request) {
    const err = new Error('PPR request not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  if (!applied) {
    const err = new Error('Can only review requests with pending status')
    err.code = 'NOT_PENDING'
    throw err
  }

  try {
    await notifier.notifyRequestReviewed({ ...request, key }, token)
  } catch (e) {
    console.error('Failed to send PPR review notification for request', key)
  }
}

module.exports = reviewRequest
