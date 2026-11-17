'use strict'

const { normalizeEmail } = require('../../auth/signInEmail')
const { CATEGORIES } = require('../../aircraftCategories')

const Status = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  // an approval an admin took back, e.g. after a closure came up
  REVOKED: 'revoked'
}

// reviewedBy of the requests answered on submission (see pprAnswer.js)
const AUTOMATIC_REVIEWER = 'automatic'

// The keys requests are stored under (Firebase push keys). The routes refuse
// other keys, and the aerodrome's email links only to such keys.
const REQUEST_KEY_PATTERN = /^[-\w]{1,128}$/

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

// As in the movement form, the aircraft's type, MTOW and category too: the
// pilot declares them, and the answer goes by them (see pprAnswer.js)
const REQUIRED_FIELDS = [
  'firstname',
  'lastname',
  'email',
  'immatriculation',
  'aircraftType',
  'aircraftCategory',
  'plannedDate',
  'plannedTime',
  'flightType'
]

const TEXT_FIELDS = [
  ...REQUIRED_FIELDS,
  'phone',
  'remarks',
  'createdBy'
]

// The largest MTOW taken, in kg
const MAX_MTOW = 1000000

// What a pilot fills in, apart from the address. The routes take only these
// fields from a submission; they add the address and either the owner (the
// login) or the mark of a request without login themselves.
const PILOT_FIELDS = [
  'firstname',
  'lastname',
  'phone',
  'immatriculation',
  'aircraftType',
  'aircraftCategory',
  'mtow',
  'plannedDate',
  'plannedTime',
  'flightType',
  'remarks',
  'language'
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

// A real calendar date as 'YYYY-MM-DD'
function isValidDate(value) {
  return typeof value === 'string' && DATE_REGEX.test(value) && isCalendarDate(value)
}

// Fields of a single line. A line break in them would start a new line in
// the text emails, e.g. one imitating the link the aerodrome's email ends
// with; the remarks keep theirs.
const SINGLE_LINE_FIELDS = [
  'firstname',
  'lastname',
  'phone',
  'immatriculation',
  'aircraftType',
  'flightType'
]

// Runs of white space and control characters, line breaks of any kind
// included (NEL is a control character, not white space, for \s)
const BREAKS_AND_CONTROLS = /[\s\u0000-\u001f\u007f-\u009f]+/g

function toSingleLine(value) {
  return value.replace(BREAKS_AND_CONTROLS, ' ')
}

// Free text is stored as entered, only trimmed and length-limited: every
// output escapes it (React, escapeHtml in the email templates), so removing
// markup would only lose text like "MTOW < 2t, ETA > 14:00". Fields of a
// single line are kept on one.
function sanitizeString(value, field) {
  if (typeof value !== 'string') return ''
  const text = SINGLE_LINE_FIELDS.includes(field) ? toSingleLine(value) : value
  const trimmed = text.trim()
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

// Control characters alone don't fill a field either: they are removed
function validateRequired(input) {
  const missing = REQUIRED_FIELDS.filter(field => !input[field] || toSingleLine(input[field]).trim() === '')
  if (input.mtow === undefined || input.mtow === null || input.mtow === '') {
    missing.push('mtow')
  }
  if (missing.length > 0) {
    throw invalid(`Missing required fields: ${missing.join(', ')}`)
  }
}

// A whole number of kg, as in the movement form, given as a number or as
// its digits
function readMtow(value) {
  const mtow = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN
  if (!Number.isInteger(mtow) || mtow <= 0 || mtow > MAX_MTOW) {
    throw invalid('Invalid mtow value')
  }
  return mtow
}

// One of the app's categories
function readAircraftCategory(value) {
  if (!CATEGORIES.includes(value)) {
    throw invalid('Invalid aircraftCategory')
  }
  return value
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(email)
}

function validateEmail(email) {
  if (!isValidEmail(email)) {
    throw invalid('Invalid email format')
  }
}

// The address the pilot's emails go to. With a login it is the login's,
// which Firebase Auth verified. Nobody confirmed the address of a request
// without login, so it must be a plain one, lower-cased, by the rule of the
// sign-in code (auth/signInEmail.js): the mailer would read e.g. a comma as
// the start of a further recipient.
function readEmail(value, withoutLogin) {
  if (withoutLogin) {
    const email = normalizeEmail(value)
    if (email === null) {
      throw invalid('Invalid email format')
    }
    return email
  }
  const email = sanitizeString(value, 'email')
  validateEmail(email)
  return email
}

// Letters, digits and hyphens only, as the app sends registrations (it drops
// everything else). The registration is the one value a pilot types that the
// receipt and the answer show, also at addresses nobody confirmed, and mail
// clients would turn e.g. 'EVIL.XYZ' into a link.
const IMMATRICULATION_REGEX = /^[A-Z0-9-]+$/

function readImmatriculation(value) {
  const immatriculation = sanitizeString(value, 'immatriculation').toUpperCase()
  // Upper-casing can lengthen it (e.g. 'ß' becomes 'SS')
  if (!IMMATRICULATION_REGEX.test(immatriculation) ||
    immatriculation.length > MAX_LENGTHS.immatriculation) {
    throw invalid('Invalid immatriculation')
  }
  return immatriculation
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

// The fields of a submission a pilot fills in (PILOT_FIELDS), whatever else
// it holds; an empty body (undefined) has none.
function pilotInput(body) {
  const source = body || {}
  const input = {}
  PILOT_FIELDS.forEach(field => {
    if (source[field] !== undefined) {
      input[field] = source[field]
    }
  })
  return input
}

/**
 * A new pending request from the input of a route: the pilot's fields, the
 * address, and either the login that makes it (createdBy, its address) or
 * `withoutLogin: true`. Throws INVALID_INPUT for input it can't take.
 */
function createPprRequest(input, now) {
  validateTypes(input)
  validateRequired(input)

  const timestamp = now || Date.now()
  const withoutLogin = input.withoutLogin === true

  const firstname = sanitizeString(input.firstname, 'firstname')
  const lastname = sanitizeString(input.lastname, 'lastname')
  const email = readEmail(input.email, withoutLogin)
  const immatriculation = readImmatriculation(input.immatriculation)
  const aircraftType = sanitizeString(input.aircraftType, 'aircraftType')
  const aircraftCategory = readAircraftCategory(input.aircraftCategory)
  const mtow = readMtow(input.mtow)
  const plannedDate = input.plannedDate.trim()
  const plannedTime = input.plannedTime.trim()
  const flightType = sanitizeString(input.flightType, 'flightType')

  validateDate(plannedDate)
  validateDateRange(plannedDate, timestamp)
  validateTime(plannedTime)

  const request = {
    status: Status.PENDING,
    firstname,
    lastname,
    email,
    immatriculation,
    aircraftType,
    aircraftCategory,
    mtow,
    plannedDate,
    plannedTime,
    flightType,
    language: LANGUAGES.includes(input.language) ? input.language : DEFAULT_LANGUAGE,
    createdAt: timestamp,
    negativeTimestamp: -timestamp
  }

  // The login that made a request owns it: it is in that pilot's list, and
  // the pilot can delete it. A request without login belongs to nobody, also
  // not to a later login with its unconfirmed address.
  const createdBy = sanitizeString(input.createdBy, 'email')
  if (withoutLogin) {
    request.withoutLogin = true
  } else if (createdBy) {
    request.createdBy = createdBy
  }

  if (input.phone) {
    request.phone = sanitizeString(input.phone, 'phone')
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

// Only pending requests can be reviewed, and pilots can only delete their
// own pending requests. An approval can still be revoked by an admin; a
// rejection is final.
function canBeReviewed(request) {
  return request.status === Status.PENDING
}

function canBeRevoked(request) {
  return request.status === Status.APPROVED
}

// A missing or empty address owns nothing: requests without login have no
// createdBy, and undefined === undefined would match.
function canBeDeletedBy(request, email) {
  return typeof email === 'string' && email !== '' &&
    request.createdBy === email && request.status === Status.PENDING
}

// The holder of a status link withdraws a request while it is pending, as a
// pilot deletes it in the app.
function canBeWithdrawn(request) {
  return request.status === Status.PENDING
}

module.exports = {
  Status,
  AUTOMATIC_REVIEWER,
  REQUEST_KEY_PATTERN,
  MAX_LENGTHS,
  MAX_DAYS_AHEAD,
  REQUIRED_FIELDS,
  LANGUAGES,
  DEFAULT_LANGUAGE,
  pilotInput,
  createPprRequest,
  sanitizeReviewRemarks,
  validateReviewStatus,
  canBeReviewed,
  canBeRevoked,
  canBeDeletedBy,
  canBeWithdrawn,
  sanitizeString,
  zurichDate,
  addDays,
  invalid,
  isValidEmail,
  isValidDate
}
