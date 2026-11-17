'use strict'

const { zurichDate } = require('../domain/pprRequest')
const { closuresFromStore } = require('../domain/pprSettings')

/**
 * The closures that haven't ended, for the request form: pilots see the days
 * requests are rejected for, with the reason, before they ask. Sorted by
 * start; closures that aren't valid are left out, as on submission.
 *
 * @param {Object} deps - { settings }
 * @param {number} [now] - Current timestamp (for testing)
 * @returns {Promise<Array<{from: string, to: string, reason: string}>>}
 */
async function getClosures({ settings }, now = Date.now()) {
  const { closures } = await settings.getAnswerSettings()
  const today = zurichDate(now)
  return closuresFromStore(closures).filter(closure => closure.to >= today)
}

module.exports = getClosures
