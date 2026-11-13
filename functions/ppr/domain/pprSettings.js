'use strict'

const { invalid, isValidEmail, isValidDate } = require('./pprRequest')

const MAX_EMAIL_LENGTH = 254

// How new requests are answered: by an admin, or automatically approved
// with the information for pilots (see pprAnswer.js)
const AnswerMode = {
  MANUAL: 'manual',
  AUTOMATIC: 'automatic'
}
const MAX_PILOT_INFO_LENGTH = 1000
const MAX_CLOSURES = 50
const MAX_CLOSURE_REASON_LENGTH = 300

// Days after a request's planned date until the daily cleanup deletes it.
// Without a value nothing is deleted, as for the other retention settings.
// Larger values would push the cleanup's cutoff out of the 'YYYY-MM-DD'
// range its date comparison relies on.
const MAX_RETENTION_DAYS = 3650

// The address new requests are sent to; an empty value removes it.
function normalizeAdminEmail(value) {
  if (value === undefined || value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw invalid('Invalid adminEmail')
  }
  const email = value.trim()
  if (email === '') {
    return null
  }
  if (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
    throw invalid('Invalid email format')
  }
  return email
}

function isValidRetentionDays(value) {
  return Number.isInteger(value) && value > 0 && value <= MAX_RETENTION_DAYS
}

// The retention set by an admin; an empty value removes it.
function normalizeRetentionDays(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }
  if (!isValidRetentionDays(value)) {
    throw invalid(`retentionDays must be a whole number from 1 to ${MAX_RETENTION_DAYS}`)
  }
  return value
}

// An empty value goes back to manual answers
function normalizeAnswerMode(value) {
  if (value === undefined || value === null || value === '') {
    return AnswerMode.MANUAL
  }
  if (value !== AnswerMode.MANUAL && value !== AnswerMode.AUTOMATIC) {
    throw invalid('answerMode must be manual or automatic')
  }
  return value
}

// Anything but a stored 'automatic' means manual answers, so nothing is
// approved by mistake
function answerModeFromStore(stored) {
  return stored === AnswerMode.AUTOMATIC ? AnswerMode.AUTOMATIC : AnswerMode.MANUAL
}

// The information automatic approvals carry; an empty value removes it
function normalizePilotInfo(value) {
  if (value === undefined || value === null) {
    return null
  }
  if (typeof value !== 'string') {
    throw invalid('Invalid pilotInfo')
  }
  const text = value.trim()
  if (text === '') {
    return null
  }
  if (text.length > MAX_PILOT_INFO_LENGTH) {
    throw invalid(`pilotInfo must be at most ${MAX_PILOT_INFO_LENGTH} characters`)
  }
  return text
}

function pilotInfoFromStore(stored) {
  return typeof stored === 'string' && stored.trim() !== ''
    ? stored.trim().slice(0, MAX_PILOT_INFO_LENGTH)
    : null
}

function normalizeClosure(closure) {
  if (!closure || typeof closure !== 'object') {
    throw invalid('Invalid closure')
  }
  const { from, to, reason } = closure
  if (!isValidDate(from) || !isValidDate(to)) {
    throw invalid('A closure needs valid from and to dates (YYYY-MM-DD)')
  }
  if (to < from) {
    throw invalid('A closure cannot end before it starts')
  }
  if (typeof reason !== 'string' || reason.trim() === '') {
    throw invalid('A closure needs a reason')
  }
  const text = reason.trim()
  if (text.length > MAX_CLOSURE_REASON_LENGTH) {
    throw invalid(`A closure reason must be at most ${MAX_CLOSURE_REASON_LENGTH} characters`)
  }
  return { from, to, reason: text }
}

// The days requests are rejected for, with the reason; sorted by start
function normalizeClosures(value) {
  if (value === undefined || value === null) {
    return []
  }
  if (!Array.isArray(value)) {
    throw invalid('closures must be a list')
  }
  if (value.length > MAX_CLOSURES) {
    throw invalid(`At most ${MAX_CLOSURES} closures`)
  }
  return value.map(normalizeClosure).sort((a, b) => a.from.localeCompare(b.from))
}

// The database may return a list as an object; closures that aren't valid
// (e.g. changed in the console) are left out
function closuresFromStore(stored) {
  if (!stored || typeof stored !== 'object') {
    return []
  }
  const closures = []
  for (const closure of Object.values(stored)) {
    try {
      closures.push(normalizeClosure(closure))
    } catch (e) {
      // not a valid closure
    }
  }
  return closures.sort((a, b) => a.from.localeCompare(b.from))
}

module.exports = {
  MAX_RETENTION_DAYS,
  AnswerMode,
  MAX_PILOT_INFO_LENGTH,
  MAX_CLOSURES,
  MAX_CLOSURE_REASON_LENGTH,
  normalizeAdminEmail,
  isValidRetentionDays,
  normalizeRetentionDays,
  normalizeAnswerMode,
  answerModeFromStore,
  normalizePilotInfo,
  pilotInfoFromStore,
  normalizeClosures,
  closuresFromStore
}
