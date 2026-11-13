'use strict'

const { invalid, isValidEmail } = require('./pprRequest')

const MAX_EMAIL_LENGTH = 254

// Days after a request's planned date until the daily cleanup deletes it.
// Larger values would push the cleanup's cutoff out of the 'YYYY-MM-DD'
// range its date comparison relies on.
const DEFAULT_RETENTION_DAYS = 30
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

// The retention set by an admin; an empty value goes back to the default.
function normalizeRetentionDays(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }
  if (!isValidRetentionDays(value)) {
    throw invalid(`retentionDays must be a whole number from 1 to ${MAX_RETENTION_DAYS}`)
  }
  return value
}

// The retention the cleanup uses: the stored value if valid, else the default
function retentionDaysOrDefault(stored) {
  return isValidRetentionDays(stored) ? stored : DEFAULT_RETENTION_DAYS
}

module.exports = {
  DEFAULT_RETENTION_DAYS,
  MAX_RETENTION_DAYS,
  normalizeAdminEmail,
  isValidRetentionDays,
  normalizeRetentionDays,
  retentionDaysOrDefault
}
