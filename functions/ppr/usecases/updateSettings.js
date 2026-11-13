'use strict'

const {
  normalizeAdminEmail,
  normalizeRetentionDays,
  normalizeAnswerMode,
  normalizePilotInfo,
  normalizeClosures
} = require('../domain/pprSettings')
const getSettings = require('./getSettings')

/**
 * Update the given PPR settings, leaving the others as they are:
 * - adminEmail: the address new requests are sent to (empty removes it)
 * - retentionDays: days after the planned date until requests are deleted
 *   (empty removes it, so nothing is deleted)
 * - answerMode: 'manual' or 'automatic' (empty goes back to manual)
 * - pilotInfo: the text automatic approvals carry (empty removes it)
 * - closures: [{ from, to, reason }], the days requests are rejected for
 * Everything is validated before anything is written.
 *
 * @param {Object} deps - { settings }
 * @param {Object} input - { adminEmail?, retentionDays?, answerMode?, pilotInfo?, closures? }
 * @returns {Promise<Object>} all settings, as getSettings returns them
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

  if ('answerMode' in input) {
    const answerMode = normalizeAnswerMode(input.answerMode)
    writes.push(() => settings.setAnswerMode(answerMode))
  }

  if ('pilotInfo' in input) {
    const pilotInfo = normalizePilotInfo(input.pilotInfo)
    writes.push(() => settings.setPilotInfo(pilotInfo))
  }

  if ('closures' in input) {
    const closures = normalizeClosures(input.closures)
    writes.push(() => settings.setClosures(closures))
  }

  for (const write of writes) {
    await write()
  }

  return getSettings({ settings })
}

module.exports = updateSettings
