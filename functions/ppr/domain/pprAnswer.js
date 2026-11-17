'use strict'

const { Status } = require('./pprRequest')
const { AnswerMode } = require('./pprSettings')
const { isHelicopter } = require('../../aircraftCategories')

/**
 * Why an admin answers a request that would be approved automatically, or
 * null: a helicopter, or an MTOW from the limit on (included), by the
 * category and the MTOW the pilot declared.
 *
 * @param {Object} request - the new request, with aircraftCategory and mtow
 * @param {{helicopters: boolean, mtowFrom: number|null}} manualAnswers
 * @returns {{reason: string, mtowFrom?: number}|null} reason: 'helicopter' or 'mtow'
 */
function manualAnswerReason(request, manualAnswers) {
  const { helicopters, mtowFrom } = manualAnswers || {}
  if (helicopters && isHelicopter(request.aircraftCategory)) {
    return { reason: 'helicopter' }
  }
  if (mtowFrom && typeof request.mtow === 'number' && request.mtow >= mtowFrom) {
    return { reason: 'mtow', mtowFrom }
  }
  return null
}

/**
 * The answer a new request gets on submission, or null if an admin answers
 * it. Many aerodromes answer PPR calls with a recorded message; this is the
 * written form of it.
 *
 * 1. The aerodrome is closed on the planned date: a closure covers it, or the
 *    aerodrome status is "closed" and the request is for today (the status
 *    tells about the present, not about later days). Rejected with the
 *    closure's reason or the status details.
 * 2. Automatic answers: approved with the information for pilots, unless
 *    the aircraft is one an admin answers (see manualAnswerReason).
 * 3. Otherwise null: the request waits for an admin.
 *
 * @param {Object} request - the new request (plannedDate as 'YYYY-MM-DD')
 * @param {Object} options
 * @param {string} options.answerMode - AnswerMode.MANUAL or AnswerMode.AUTOMATIC
 * @param {string|null} options.pilotInfo - text automatic approvals carry
 * @param {Array<{from: string, to: string, reason: string}>} options.closures
 * @param {{status: string, details: string|null}|null} options.aerodromeStatus
 * @param {string} options.today - the aerodrome's date, 'YYYY-MM-DD'
 * @param {{helicopters: boolean, mtowFrom: number|null}} [options.manualAnswers]
 * @returns {{status: string, reviewRemarks: string|null}|null}
 */
function decideAnswer(request, { answerMode, pilotInfo, closures, aerodromeStatus, today, manualAnswers }) {
  const closure = (closures || []).find(
    c => c.from <= request.plannedDate && request.plannedDate <= c.to
  )
  if (closure) {
    return { status: Status.REJECTED, reviewRemarks: closure.reason }
  }

  if (aerodromeStatus && aerodromeStatus.status === 'closed' && request.plannedDate === today) {
    return { status: Status.REJECTED, reviewRemarks: aerodromeStatus.details || null }
  }

  if (answerMode === AnswerMode.AUTOMATIC && !manualAnswerReason(request, manualAnswers)) {
    return { status: Status.APPROVED, reviewRemarks: pilotInfo || null }
  }

  return null
}

module.exports = { decideAnswer, manualAnswerReason }
