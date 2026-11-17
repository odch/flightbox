'use strict'

const {
  normalizeAdminEmail,
  normalizeRetentionDays,
  normalizeAnswerMode,
  normalizePilotInfo,
  normalizeClosures,
  normalizeManualAnswers
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
 * - manualAnswers: { helicopters, mtowFrom }, the requests an admin answers
 *   also with automatic answers (empty switches them off)
 * Everything is validated, then written at once.
 *
 * @param {Object} deps - { settings }
 * @param {Object} input - { adminEmail?, retentionDays?, answerMode?, pilotInfo?, closures?, manualAnswers? }
 * @returns {Promise<Object>} all settings, as getSettings returns them
 */
async function updateSettings({ settings }, input) {
  const changes = {}

  if ('adminEmail' in input) {
    changes.adminEmail = normalizeAdminEmail(input.adminEmail)
  }

  if ('retentionDays' in input) {
    changes.retentionDays = normalizeRetentionDays(input.retentionDays)
  }

  if ('answerMode' in input) {
    changes.answerMode = normalizeAnswerMode(input.answerMode)
  }

  if ('pilotInfo' in input) {
    changes.pilotInfo = normalizePilotInfo(input.pilotInfo)
  }

  if ('closures' in input) {
    changes.closures = normalizeClosures(input.closures)
  }

  if ('manualAnswers' in input) {
    changes.manualAnswers = normalizeManualAnswers(input.manualAnswers)
  }

  // In one write: e.g. automatic answers never apply without the aircraft
  // an admin answers that come with them
  if (Object.keys(changes).length > 0) {
    await settings.saveSettings(changes)
  }

  return getSettings({ settings })
}

module.exports = updateSettings
