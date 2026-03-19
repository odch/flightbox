'use strict'

const { createPprRequest } = require('../domain/pprRequest')

/**
 * Submit a new PPR request.
 *
 * @param {Object} deps - { repository, notifier }
 * @param {Object} input - Raw form input from pilot
 * @param {string} adminEmail - Admin email to notify
 * @param {number} [now] - Current timestamp (for testing)
 * @returns {Promise<{key: string}>}
 */
async function submitRequest({ repository, notifier }, input, adminEmail, now) {
  const pprRequest = createPprRequest(input, now)
  const { key } = await repository.save(pprRequest)
  const saved = { ...pprRequest, key }

  if (adminEmail) {
    try {
      await notifier.notifyRequestSubmitted(saved, adminEmail)
    } catch (e) {
      console.error('Failed to send PPR notification for request', key)
    }
  }

  return { key }
}

module.exports = submitRequest
