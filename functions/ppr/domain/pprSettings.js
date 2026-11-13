'use strict'

const { invalid, isValidEmail } = require('./pprRequest')

const MAX_EMAIL_LENGTH = 254

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

module.exports = {
  MAX_RETENTION_DAYS,
  normalizeAdminEmail,
  isValidRetentionDays,
  normalizeRetentionDays
}
