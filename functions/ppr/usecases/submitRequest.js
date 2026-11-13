'use strict'

const {
  createPprRequest,
  sanitizeReviewRemarks,
  zurichDate,
  AUTOMATIC_REVIEWER,
  Status
} = require('../domain/pprRequest')
const { answerModeFromStore, pilotInfoFromStore, closuresFromStore } = require('../domain/pprSettings')
const { decideAnswer } = require('../domain/pprAnswer')

// A status that can't be read doesn't stop submissions; it only can't
// reject requests for today
async function readAerodromeStatus(aerodromeStatus) {
  try {
    return await aerodromeStatus.getCurrent()
  } catch (e) {
    console.error('Failed to read the aerodrome status for a PPR request')
    return null
  }
}

/**
 * Submit a new PPR request. It is answered right away when the aerodrome is
 * closed on the planned date or answers automatically (see pprAnswer.js);
 * otherwise it waits for an admin.
 *
 * @param {Object} deps - { repository, notifier, settings, aerodromeStatus }
 * @param {Object} input - Raw form input from pilot
 * @param {number} [now] - Current timestamp (for testing)
 * @returns {Promise<{key: string, status: string, reviewRemarks?: string}>}
 */
async function submitRequest({ repository, notifier, settings, aerodromeStatus }, input, now = Date.now()) {
  const pprRequest = createPprRequest(input, now)

  const [adminEmail, answerSettings, currentStatus] = await Promise.all([
    settings.getAdminEmail(),
    settings.getAnswerSettings(),
    readAerodromeStatus(aerodromeStatus)
  ])

  const answer = decideAnswer(pprRequest, {
    answerMode: answerModeFromStore(answerSettings.answerMode),
    pilotInfo: pilotInfoFromStore(answerSettings.pilotInfo),
    closures: closuresFromStore(answerSettings.closures),
    aerodromeStatus: currentStatus,
    today: zurichDate(now)
  })

  // Saved with its answer, so it is never pending in between
  const toSave = { ...pprRequest }
  if (answer) {
    toSave.status = answer.status
    toSave.reviewedBy = AUTOMATIC_REVIEWER
    toSave.reviewedAt = now
    const remarks = answer.reviewRemarks && sanitizeReviewRemarks(answer.reviewRemarks)
    if (remarks) {
      toSave.reviewRemarks = remarks
    }
  }

  const { key } = await repository.save(toSave)
  const saved = { ...toSave, key }

  // Sent side by side: the pilot waits for the answer in the form. A failed
  // email doesn't fail the saved request.
  const notifications = []
  if (adminEmail) {
    notifications.push(Promise.resolve()
      .then(() => notifier.notifyRequestSubmitted(saved, adminEmail))
      .catch(() => console.error('Failed to send PPR notification for request', key)))
  } else if (saved.status === Status.PENDING) {
    // Admins set the address in the PPR admin tab
    console.warn('No PPR notification address is set, request not announced:', key)
  }
  if (answer) {
    notifications.push(Promise.resolve()
      .then(() => notifier.notifyRequestReviewed(saved))
      .catch(() => console.error('Failed to send the automatic PPR answer for request', key)))
  }
  await Promise.all(notifications)

  const result = { key, status: saved.status }
  if (saved.reviewRemarks) {
    result.reviewRemarks = saved.reviewRemarks
  }
  return result
}

module.exports = submitRequest
