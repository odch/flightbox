'use strict'

const {
  validateStatusTransition,
  sanitizeReviewRemarks
} = require('../domain/pprRequest')

/**
 * Review (approve/reject) a PPR request.
 *
 * @param {Object} deps - { repository, notifier }
 * @param {string} key - PPR request key
 * @param {Object} review - { status, reviewedBy, reviewedAt, reviewRemarks? }
 * @returns {Promise<void>}
 */
async function reviewRequest({ repository, notifier }, key, review) {
  const existing = await repository.findByKey(key)
  if (!existing) {
    const err = new Error('PPR request not found')
    err.code = 'NOT_FOUND'
    throw err
  }

  validateStatusTransition(existing.status, review.status)

  const reviewData = {
    status: review.status,
    reviewedBy: review.reviewedBy,
    reviewedAt: review.reviewedAt
  }

  if (review.reviewRemarks) {
    reviewData.reviewRemarks = sanitizeReviewRemarks(review.reviewRemarks)
  }

  await repository.updateStatus(key, reviewData)

  try {
    await notifier.notifyRequestReviewed({
      ...existing,
      ...reviewData,
      key
    })
  } catch (e) {
    console.error('Failed to send PPR review notification for request', key)
  }
}

module.exports = reviewRequest
