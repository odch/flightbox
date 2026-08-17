const moment = require('moment')

// Server-side reconstruction of the customs "prepopulated form" payload.
//
// This used to be built on the client and forwarded verbatim to the trusted
// customs integration, which let any caller submit arbitrary declarations. The
// payload is now built here from the stored movement, so the only client input
// is a reference (movementType + movementKey); everything sent onward comes
// from trusted database data.

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

// Mirrors the client's calculateArrivalTime: add the flight duration to the
// departure time. Plain HH:mm arithmetic, no timezone involved.
const calculateArrivalTime = (departureTime, duration) => {
  const { hours, minutes } = parseDuration(duration)
  return moment(departureTime, 'HH:mm').add(hours, 'hours').add(minutes, 'minutes').format('HH:mm')
}

// Mirrors the client's dates.formatDate(date, 'de'): Swiss-German short date
// (DD.MM.YYYY). Date-only, so timezone does not affect the result.
const formatDate = (localDate) => moment(localDate, 'YYYY-MM-DD').locale('de-ch').format('L')

const getDirectionDependingData = (movementType, movement, aerodrome) => {
  if (movementType === 'departure') {
    return {
      departureTime: movement.time,
      arrivalCountry: aerodrome.country,
      arrivalLocation: aerodrome.name,
      arrivalTime: calculateArrivalTime(movement.time, movement.duration),
    }
  }
  return {
    arrivalTime: movement.time,
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

  return {
    aerodromeId,
    externalId: movementKey,
    data: {
      direction: movementType,
      date: formatDate(movement.date),
      phone: movement.phone,
      email: movement.email,
      registration: movement.immatriculation,
      mtow: movement.mtow,
      aircraftType: getCustomsAircraftType(movement.aircraftCategory),
      ...getDirectionDependingData(movementType, movement, aerodrome),
    },
  }
}

module.exports = {
  buildCustomsPayload,
  getCustomsAircraftType,
  parseDuration,
  calculateArrivalTime,
  formatDate,
}
