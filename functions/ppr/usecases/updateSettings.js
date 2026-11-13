'use strict'

const { normalizeAdminEmail, normalizeRetentionDays } = require('../domain/pprSettings')
const getSettings = require('./getSettings')

/**
 * Update the given PPR settings, leaving the others as they are:
 * - adminEmail: the address new requests are sent to (empty removes it)
 * - retentionDays: days after the planned date until requests are deleted
 *   (empty removes it, so nothing is deleted)
 * Everything is validated before anything is written.
 *
 * @param {Object} deps - { settings }
 * @param {Object} input - { adminEmail?, retentionDays? }
 * @returns {Promise<{adminEmail: string|null, retentionDays: number|null}>}
 */
async function updateSettings({ settings }, input) {
  const writes = []
  if ('adminEmail' in input) {
    const adminEmail = normalizeAdminEmail(input.adminEmail)
    writes.push(() => settings.setAdminEmail(adminEmail))
  }
  if ('retentionDays' in input) {
    const retentionDays = normalizeRetentionDays(input.retentionDays)
    writes.push(() => settings.setRetentionDays(retentionDays))
  }
  for (const write of writes) {
    await write()
  }
  return getSettings({ settings })
}

module.exports = updateSettings
