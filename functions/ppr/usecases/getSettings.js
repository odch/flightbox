'use strict'

const { isValidRetentionDays } = require('../domain/pprSettings')

/**
 * The PPR settings, for the admin area. A stored retention that isn't valid
 * is reported as null, since the cleanup ignores it too.
 *
 * @param {Object} deps - { settings }
 * @returns {Promise<{adminEmail: string|null, retentionDays: number|null}>}
 */
async function getSettings({ settings }) {
  const [adminEmail, retentionDays] = await Promise.all([
    settings.getAdminEmail(),
    settings.getRetentionDays()
  ])
  return {
    adminEmail,
    retentionDays: isValidRetentionDays(retentionDays) ? retentionDays : null
  }
}

module.exports = getSettings
