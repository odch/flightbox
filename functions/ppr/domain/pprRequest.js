'use strict'

const Status = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

const MAX_LENGTHS = {
  firstname: 100,
  lastname: 100,
  email: 254,
  phone: 30,
  immatriculation: 10,
  aircraftType: 50,
  flightType: 50,
  remarks: 500,
  reviewRemarks: 500
}

const REQUIRED_FIELDS = [
  'firstname',
  'lastname',
  'email',
  'immatriculation',
  'plannedDate',
  'plannedTime',
  'flightType'
]

const TEXT_FIELDS = [
  ...REQUIRED_FIELDS,
  'phone',
  'aircraftType',
  'remarks',
  'createdBy'
]

// Language of the pilot's emails: the app language at submission time.
// German is the default, as for the sign-in email.
const LANGUAGES = ['de', 'en']
const DEFAULT_LANGUAGE = 'de'

// Requests further ahead are refused: cleanup deletes requests only after
// their planned date, so a far-future date would keep the pilot's personal
// data indefinitely.
const MAX_DAYS_AHEAD = 365

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^\d{2}:\d{2}$/

const ZURICH_DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Zurich',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

// Error for invalid client input (400), as opposed to failures (500)
function invalid(message) {
  const err = new Error(message)
  err.code = 'INVALID_INPUT'
  return err
}

// The aerodrome's calendar date ('YYYY-MM-DD'); the functions run in UTC.
function zurichDate(timestamp) {
  const parts = {}
  ZURICH_DATE_FORMAT.formatToParts(new Date(timestamp)).forEach(part => {
    parts[part.type] = part.value
  })
  return `${parts.year}-${parts.month}-${parts.day}`
}

// Calendar arithmetic on 'YYYY-MM-DD' dates, independent of time zones
function addDays(dateStr, days) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

function isCalendarDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
}

// Free text is stored as entered, only trimmed and length-limited: every
// output escapes it (React, escapeHtml in the email templates), so removing
// markup would only lose text like "MTOW < 2t, ETA > 14:00".
function sanitizeString(value, field) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  const maxLength = MAX_LENGTHS[field]
  return maxLength ? trimmed.slice(0, maxLength) : trimmed
}

function validateTypes(input) {
  const wrong = TEXT_FIELDS.filter(
    field => input[field] !== undefined && input[field] !== null && typeof input[field] !== 'string'
  )
  if (wrong.length > 0) {
    throw invalid(`Invalid fields: ${wrong.join(', ')}`)
  }
}

function validateRequired(input) {
  const missing = REQUIRED_FIELDS.filter(field => !input[field] || input[field].trim() === '')
  if (missing.length > 0) {
    throw invalid(`Missing required fields: ${missing.join(', ')}`)
  }
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(email)
}

function validateEmail(email) {
  if (!isValidEmail(email)) {
    throw invalid('Invalid email format')
  }
}

function validateDate(dateStr) {
  if (!DATE_REGEX.test(dateStr)) {
    throw invalid('Invalid date format, expected YYYY-MM-DD')
  }
  if (!isCalendarDate(dateStr)) {
    throw invalid('Invalid date')
  }
}

function validateDateRange(dateStr, now) {
  const today = zurichDate(now)
  if (dateStr < today) {
    throw invalid('plannedDate must be today or in the future')
  }
  if (dateStr > addDays(today, MAX_DAYS_AHEAD)) {
    throw invalid(`plannedDate must be within ${MAX_DAYS_AHEAD} days`)
  }
}

function validateTime(timeStr) {
  if (!TIME_REGEX.test(timeStr)) {
    throw invalid('Invalid time format, expected HH:MM')
  }
  const [hours, minutes] = timeStr.split(':').map(Number)
  if (hours > 23 || minutes > 59) {
    throw invalid('Invalid time value')
  }
}

function createPprRequest(input, now) {
  validateTypes(input)
  validateRequired(input)

  const timestamp = now || Date.now()

  const firstname = sanitizeString(input.firstname, 'firstname')
  const lastname = sanitizeString(input.lastname, 'lastname')
  const email = sanitizeString(input.email, 'email')
  const immatriculation = sanitizeString(input.immatriculation, 'immatriculation')
  const plannedDate = input.plannedDate.trim()
  const plannedTime = input.plannedTime.trim()
  const flightType = sanitizeString(input.flightType, 'flightType')

  validateEmail(email)
  validateDate(plannedDate)
  validateDateRange(plannedDate, timestamp)
  validateTime(plannedTime)

  const request = {
    status: Status.PENDING,
    firstname,
    lastname,
    email,
    immatriculation: immatriculation.toUpperCase(),
    plannedDate,
    plannedTime,
    flightType,
    language: LANGUAGES.includes(input.language) ? input.language : DEFAULT_LANGUAGE,
    createdBy: sanitizeString(input.createdBy, 'email'),
    createdAt: timestamp,
    negativeTimestamp: -timestamp
  }

  if (input.phone) {
    request.phone = sanitizeString(input.phone, 'phone')
  }

  if (input.aircraftType) {
    request.aircraftType = sanitizeString(input.aircraftType, 'aircraftType')
  }

  if (input.mtow !== undefined && input.mtow !== null && input.mtow !== '') {
    const mtow = Number(input.mtow)
    if (isNaN(mtow) || mtow < 0) {
      throw invalid('Invalid mtow value')
    }
    request.mtow = mtow
  }

  if (input.remarks) {
    request.remarks = sanitizeString(input.remarks, 'remarks')
  }

  return request
}

function sanitizeReviewRemarks(remarks) {
  return sanitizeString(remarks, 'reviewRemarks')
}

function validateReviewStatus(newStatus) {
  if (newStatus !== Status.APPROVED && newStatus !== Status.REJECTED) {
    throw invalid('New status must be approved or rejected')
  }
}

// Decisions are final: only pending requests can be reviewed, and pilots
// can only delete their own pending requests.
function canBeReviewed(request) {
  return request.status === Status.PENDING
}

function canBeDeletedBy(request, email) {
  return request.createdBy === email && request.status === Status.PENDING
}

module.exports = {
  Status,
  MAX_LENGTHS,
  MAX_DAYS_AHEAD,
  REQUIRED_FIELDS,
  LANGUAGES,
  DEFAULT_LANGUAGE,
  createPprRequest,
  sanitizeReviewRemarks,
  validateReviewStatus,
  canBeReviewed,
  canBeDeletedBy,
  sanitizeString,
  zurichDate,
  addDays,
  invalid,
  isValidEmail
}
