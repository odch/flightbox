'use strict'

const {
  createPprRequest,
  sanitizeReviewRemarks,
  zurichDate,
  AUTOMATIC_REVIEWER,
  Status
} = require('../domain/pprRequest')
const { withStatusToken } = require('../domain/pprStatusLink')
const {
  AnswerMode,
  answerModeFromStore,
  pilotInfoFromStore,
  closuresFromStore,
  manualAnswersFromStore
} = require('../domain/pprSettings')
const { decideAnswer, manualAnswerReason } = require('../domain/pprAnswer')

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

// A failed email doesn't fail the saved request. Resolves to whether it
// was sent.
function sendSafely(send, failure, key) {
  return Promise.resolve()
    .then(send)
    .then(() => true, () => {
      console.error(failure, key)
      return false
    })
}

/**
 * Submit a new PPR request, with or without login (see createPprRequest).
 * It is answered right away when the aerodrome is closed on the planned date
 * or answers automatically (see pprAnswer.js); otherwise it waits for an
 * admin, with the reason where automatic answers left it to one
 * (manualAnswer). The pilot gets the answer or, while it waits, a receipt; both link
 * to the request's status with the token returned here. `emailSent` tells
 * whether that email went out: without login its link is the pilot's only
 * way back to the request.
 *
 * @param {Object} deps - { repository, notifier, settings, aerodromeStatus, statusTokens }
 * @param {Object} input - The route's input for createPprRequest
 * @param {number} [now] - Current timestamp (for testing)
 * @returns {Promise<{key: string, status: string, reviewRemarks?: string, statusToken: string,
 *   emailSent: boolean}>}
 */
async function submitRequest({ repository, notifier, settings, aerodromeStatus, statusTokens }, input, now = Date.now()) {
  const pprRequest = createPprRequest(input, now)

  const [adminEmail, answerSettings, currentStatus] = await Promise.all([
    settings.getAdminEmail(),
    settings.getAnswerSettings(),
    readAerodromeStatus(aerodromeStatus)
  ])

  const answerMode = answerModeFromStore(answerSettings.answerMode)
  const manualAnswers = manualAnswersFromStore(answerSettings.manualAnswers)

  const answer = decideAnswer(pprRequest, {
    answerMode,
    pilotInfo: pilotInfoFromStore(answerSettings.pilotInfo),
    closures: closuresFromStore(answerSettings.closures),
    aerodromeStatus: currentStatus,
    today: zurichDate(now),
    manualAnswers
  })
  // Why a request automatic answers would have approved waits for an admin
  const manualAnswer = !answer && answerMode === AnswerMode.AUTOMATIC
    ? manualAnswerReason(pprRequest, manualAnswers)
    : null

  // The token goes to the pilot only; its hash is saved with the request
  const { token, hash } = statusTokens.create()

  // Saved with its answer, so it is never pending in between
  const toSave = { ...pprRequest, statusTokens: withStatusToken(pprRequest, hash, now) }
  if (manualAnswer) {
    toSave.manualAnswer = manualAnswer
  }
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

  // Sent side by side: the pilot waits for the answer in the form
  const notifications = []
  if (adminEmail) {
    notifications.push(sendSafely(() => notifier.notifyRequestSubmitted(saved, adminEmail),
      'Failed to send PPR notification for request', key))
  } else if (saved.status === Status.PENDING) {
    // Admins set the address in the PPR admin tab
    console.warn('No PPR notification address is set, request not announced:', key)
  }
  const pilotEmail = answer
    ? sendSafely(() => notifier.notifyRequestReviewed(saved, token),
      'Failed to send the automatic PPR answer for request', key)
    : sendSafely(() => notifier.notifyRequestReceived(saved, token),
      'Failed to send the PPR receipt for request', key)
  const [emailSent] = await Promise.all([pilotEmail, ...notifications])

  const result = { key, status: saved.status }
  if (saved.reviewRemarks) {
    result.reviewRemarks = saved.reviewRemarks
  }
  result.statusToken = token
  result.emailSent = emailSent
  return result
}

module.exports = submitRequest
