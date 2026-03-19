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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const TIME_REGEX = /^\d{2}:\d{2}$/

function stripHtml(str) {
  if (typeof str !== 'string') return ''
  return str.replace(/<[^>]*>/g, '').trim()
}

function truncate(str, maxLength) {
  if (typeof str !== 'string') return ''
  return str.slice(0, maxLength)
}

function sanitizeString(value, field) {
  const stripped = stripHtml(value)
  const maxLength = MAX_LENGTHS[field]
  return maxLength ? truncate(stripped, maxLength) : stripped
}

function validateRequired(input) {
  const missing = REQUIRED_FIELDS.filter(
    field => !input[field] || (typeof input[field] === 'string' && input[field].trim() === '')
  )
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`)
  }
}

function validateEmail(email) {
  if (!EMAIL_REGEX.test(email)) {
    throw new Error('Invalid email format')
  }
}

function validateDate(dateStr) {
  if (!DATE_REGEX.test(dateStr)) {
    throw new Error('Invalid date format, expected YYYY-MM-DD')
  }
  const parsed = new Date(dateStr + 'T00:00:00')
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date')
  }
}

function validateDateInFuture(dateStr, now) {
  const today = new Date(now || Date.now())
  today.setHours(0, 0, 0, 0)
  const planned = new Date(dateStr + 'T00:00:00')
  if (planned < today) {
    throw new Error('plannedDate must be today or in the future')
  }
}

function validateTime(timeStr) {
  if (!TIME_REGEX.test(timeStr)) {
    throw new Error('Invalid time format, expected HH:MM')
  }
  const [hours, minutes] = timeStr.split(':').map(Number)
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time value')
  }
}

function createPprRequest(input, now) {
  validateRequired(input)

  const firstname = sanitizeString(input.firstname, 'firstname')
  const lastname = sanitizeString(input.lastname, 'lastname')
  const email = sanitizeString(input.email, 'email')
  const immatriculation = sanitizeString(input.immatriculation, 'immatriculation')
  const plannedDate = input.plannedDate.trim()
  const plannedTime = input.plannedTime.trim()
  const flightType = sanitizeString(input.flightType, 'flightType')

  validateEmail(email)
  validateDate(plannedDate)
  validateDateInFuture(plannedDate, now)
  validateTime(plannedTime)

  const timestamp = now || Date.now()

  const request = {
    status: Status.PENDING,
    firstname,
    lastname,
    email,
    immatriculation: immatriculation.toUpperCase(),
    plannedDate,
    plannedTime,
    flightType,
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

  if (input.mtow !== undefined && input.mtow !== null) {
    const mtow = Number(input.mtow)
    if (isNaN(mtow) || mtow < 0) {
      throw new Error('Invalid mtow value')
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

function validateStatusTransition(currentStatus, newStatus) {
  if (currentStatus !== Status.PENDING) {
    throw new Error('Can only review requests with pending status')
  }
  if (newStatus !== Status.APPROVED && newStatus !== Status.REJECTED) {
    throw new Error('New status must be approved or rejected')
  }
}

module.exports = {
  Status,
  MAX_LENGTHS,
  REQUIRED_FIELDS,
  createPprRequest,
  sanitizeReviewRemarks,
  validateStatusTransition,
  stripHtml,
  sanitizeString
}
