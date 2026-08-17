const moment = require('moment')

// Server-side reconstruction of the customs "prepopulated form" payload.
//
// This used to be built on the client and forwarded verbatim to the trusted
// customs integration, which let any caller submit arbitrary declarations. The
// payload is now built here from the stored movement, so the only client input
// is a reference (movementType + movementKey); everything sent onward comes
// from trusted database data.

const TIMEZONE = 'Europe/Zurich'

const MOVEMENT_PATHS = {
  departure: 'departures',
  arrival: 'arrivals',
}

const getCustomsAircraftType = (aircraftCategory) => {
  if (['Hubschrauber', 'Eigenbauhubschrauber'].includes(aircraftCategory)) {
    return 'helicopter'
  }
  return 'airplane'
}

const parseDuration = (duration) => {
  const [hours, minutes] = String(duration || '').split(':')
  return { hours: parseInt(hours, 10) || 0, minutes: parseInt(minutes, 10) || 0 }
}

// The movement stores a single ISO-UTC `dateTime`; the client presents it as a
// local date + time (the aerodrome runs on Europe/Zurich). Reproduce that split
// server-side so the customs payload matches what the client used to send.
// Uses Intl (full-ICU, DST-aware) so no timezone dependency is required.
const toLocalDateTimeParts = (isoUtc) => {
  const date = new Date(isoUtc)
  if (isNaN(date.getTime())) {
    return { localDate: null, localTime: null }
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const get = (type) => {
    const part = parts.find(p => p.type === type)
    return part ? part.value : ''
  }
  // Some ICU builds render midnight as '24' with hour12:false; normalize it.
  const hour = get('hour') === '24' ? '00' : get('hour')
  return {
    localDate: `${get('year')}-${get('month')}-${get('day')}`,
    localTime: `${hour}:${get('minute')}`,
  }
}

// Swiss-German short date (DD.MM.YYYY), matching the client's dates.formatDate.
const formatDate = (localDate) => {
  if (!localDate) {
    return null
  }
  return moment(localDate, 'YYYY-MM-DD', true).locale('de-ch').format('L')
}

// Add the flight duration to the local departure time. Plain HH:mm arithmetic.
const calculateArrivalTime = (departureTime, duration) => {
  if (!departureTime) {
    return null
  }
  const { hours, minutes } = parseDuration(duration)
  return moment(departureTime, 'HH:mm').add(hours, 'hours').add(minutes, 'minutes').format('HH:mm')
}

const getDirectionDependingData = (movementType, movement, aerodrome, localTime) => {
  if (movementType === 'departure') {
    return {
      departureTime: localTime,
      arrivalCountry: aerodrome.country,
      arrivalLocation: aerodrome.name,
      arrivalTime: calculateArrivalTime(localTime, movement.duration),
    }
  }
  return {
    arrivalTime: localTime,
    departureCountry: aerodrome.country,
    departureLocation: aerodrome.name,
  }
}

/**
 * Build the customs payload for a stored movement.
 * @returns the payload object, or null if the movement does not exist.
 */
const buildCustomsPayload = async (db, movementType, movementKey) => {
  const path = MOVEMENT_PATHS[movementType]
  if (!path) {
    return null
  }

  const movementSnapshot = await db.ref(`/${path}`).child(movementKey).once('value')
  if (!movementSnapshot.exists()) {
    return null
  }
  const movement = movementSnapshot.val()

  const icao = String(movement.location || '').toUpperCase()
  const aerodromeSnapshot = await db.ref('/aerodromes').child(icao).once('value')
  const aerodrome = aerodromeSnapshot.val() || {}

  // The home aerodrome is taken from server config, never the client. It is the
  // same identifier the customs integration is keyed by (also used as `?ad=`).
  const customsSnapshot = await db.ref('/settings/customsDeclarationApp').once('value')
  const customsSettings = customsSnapshot.val()
  const aerodromeId = customsSettings && customsSettings.aerodrome
    ? String(customsSettings.aerodrome).toLowerCase()
    : null

  const { localDate, localTime } = toLocalDateTimeParts(movement.dateTime)

  return {
    aerodromeId,
    externalId: movementKey,
    data: {
      direction: movementType,
      date: formatDate(localDate),
      phone: movement.phone,
      email: movement.email,
      registration: movement.immatriculation,
      mtow: movement.mtow,
      aircraftType: getCustomsAircraftType(movement.aircraftCategory),
      ...getDirectionDependingData(movementType, movement, aerodrome, localTime),
    },
  }
}

module.exports = {
  buildCustomsPayload,
  getCustomsAircraftType,
  parseDuration,
  calculateArrivalTime,
  formatDate,
  toLocalDateTimeParts,
}
