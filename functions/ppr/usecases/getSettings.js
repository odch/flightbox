'use strict'

const {
  isValidRetentionDays,
  answerModeFromStore,
  pilotInfoFromStore,
  closuresFromStore,
  manualAnswersFromStore
} = require('../domain/pprSettings')

/**
 * The PPR settings, for the admin area. Stored values that aren't valid are
 * reported the way they are used: an invalid retention as null (the cleanup
 * ignores it), anything but 'automatic' as manual answers, invalid closures
 * not at all, and so are invalid parts of the manual answers.
 *
 * @param {Object} deps - { settings }
 * @returns {Promise<{adminEmail: string|null, retentionDays: number|null,
 *   answerMode: string, pilotInfo: string|null,
 *   closures: Array<{from: string, to: string, reason: string}>,
 *   manualAnswers: {helicopters: boolean, mtowFrom: number|null}}>}
 */
async function getSettings({ settings }) {
  const [adminEmail, retentionDays, answerSettings] = await Promise.all([
    settings.getAdminEmail(),
    settings.getRetentionDays(),
    settings.getAnswerSettings()
  ])
  return {
    adminEmail,
    retentionDays: isValidRetentionDays(retentionDays) ? retentionDays : null,
    answerMode: answerModeFromStore(answerSettings.answerMode),
    pilotInfo: pilotInfoFromStore(answerSettings.pilotInfo),
    closures: closuresFromStore(answerSettings.closures),
    manualAnswers: manualAnswersFromStore(answerSettings.manualAnswers)
  }
}

module.exports = getSettings
