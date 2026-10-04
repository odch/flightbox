'use strict';

// Turns loaded movements into airstat records the way
// MovementReport.getMovementsArray / getMovementRecord do: one record per
// row, keyed by column name. Formatting is left to formatAirstatCsv, so other
// formats can reuse the records.

const { createItemsArray } = require('./sortedInsert');
const { isStoredDateTime, isoUtcToLocal } = require('./zurichTime');
const { getAirstatType, isHelicopter } = require('./tables');
const { getFromItemKey } = require('./referenceNumber');
const {
  CIRCUITS,
  CIRCUITS_KEY_SUFFIX,
  toLocalMovement,
  splitCircuits,
  compareAscending,
} = require('./movements');
const { AirstatDataError } = require('./errors');

const LOCATION_DEFAULT = 'LSZZ';

function problem(code, origin, value) {
  return { code, list: origin.list, key: origin.key, reference: getFromItemKey(origin.key), value };
}

// Inserts every movement like the client: departures, then arrivals, each in
// query order, circuits movement before its arrival. A key that is already
// present is skipped without being compared, so its dateTime is not checked
// either. Departure circuits are inserted too (they affect the order of
// tied rows) and dropped afterwards.
function orderMovements(entries, icao, problems, origins) {
  const items = createItemsArray(compareAscending);

  entries.forEach(entry => {
    const { dateTime } = entry.value;
    const local = isStoredDateTime(dateTime) ? isoUtcToLocal(dateTime) : null;
    const movement = toLocalMovement(entry.value, entry.key, entry.type, local || {});

    for (const part of splitCircuits(movement, icao)) {
      if (items.has(part.key)) {
        continue;
      }
      if (!local) {
        problems.push(problem('invalid_date_time', entry, dateTime));
        return;
      }
      origins.set(part.key, entry);
      items.insert(part);
    }
  });

  return items.array.filter(m => !(m.type === 'D' && m.departureRoute === CIRCUITS));
}

function movementType(m) {
  return m.type === 'A' && m.arrivalRoute === CIRCUITS ? 'V' : m.type;
}

function numberOfMovements(m) {
  if (m.type === 'A' && m.arrivalRoute === CIRCUITS) {
    return ((m.landingCount || 1) + (m.goAroundCount || 0)) * 2;
  }
  return 1;
}

function locationOf(location, aerodromes) {
  if (location && typeof location === 'string') {
    const upper = location.toUpperCase();
    if (aerodromes[upper]) {
      return upper;
    }
  }
  return LOCATION_DEFAULT;
}

// The client's switch falls through to '' for circuits arrivals.
function directionOfDeparture(m) {
  if (m.type === 'D') {
    return m.departureRoute;
  }
  if (m.type === 'A' && m.arrivalRoute !== CIRCUITS) {
    return m.arrivalRoute;
  }
  return '';
}

function runwayOf(m) {
  if (m.runway) {
    return m.runway;
  }
  return isHelicopter(m.immatriculation, m.aircraftCategory) ? '0' : '';
}

function runwayType(m, runways) {
  const runway = runways.find(rwy => rwy.name === m.runway);
  return runway ? runway.type : '';
}

function movementKey(key) {
  if (key.endsWith(CIRCUITS_KEY_SUFFIX)) {
    const parentKey = key.substring(0, key.length - CIRCUITS_KEY_SUFFIX.length);
    return getFromItemKey(parentKey) + CIRCUITS_KEY_SUFFIX.toUpperCase();
  }
  return getFromItemKey(key);
}

function addInternalFields(record, m, input, memberManagement) {
  record.KEY = movementKey(m.key);
  if (memberManagement) {
    record.MEMBERNR = m.memberNr;
  }
  record.LASTNAME = m.lastname;
  record.EMAIL = m.email;
  record.MTOW = m.mtow;
  record.CLUB = input.club[m.immatriculation] === true ? 1 : undefined;
  record.HOME_BASE = input.homeBase[m.immatriculation] === true ? 1 : undefined;
  record.ORIGINAL_ORIDE = record.ORIDE === LOCATION_DEFAULT ? m.location : undefined;
  record.REMARKS = m.remarks;
  record.FEES = (m.landingFeeTotal || 0) + (m.goAroundFeeTotal || 0);
  record.LDG_COUNT = m.landingCount || 0;
  record.GA_COUNT = m.goAroundCount || 0;
  record.PAYMENT_METHOD = m.paymentMethod ? m.paymentMethod.method : undefined;
  record.INVOICE_RECIPIENT = m.paymentMethod ? m.paymentMethod.invoiceRecipientName : undefined;
}

/**
 * input: {movements: [{type, list, key, value}], club, homeBase, aerodromes}
 * as returned by loadAirstatInput. options: {config, creation: {CDT, CDM},
 * internal}. Throws AirstatDataError listing every movement that has an
 * invalid dateTime or an unknown flight type, instead of a partial report.
 */
function deriveAirstatRows(input, { config, creation, internal }) {
  const icao = config.aerodrome.ICAO;
  const runways = config.aerodrome.runways;
  const memberManagement = config.memberManagement === true;
  const problems = [];
  const origins = new Map();

  const movements = orderMovements(input.movements, icao, problems, origins);

  const unknownFlightType = new Set();
  const records = movements.map(m => {
    let typeOfTraffic;
    try {
      typeOfTraffic = getAirstatType(m.flightType, m.aircraftCategory);
    } catch (e) {
      // Once per stored movement, also when it was split into two rows.
      const origin = origins.get(m.key);
      if (!unknownFlightType.has(origin)) {
        unknownFlightType.add(origin);
        problems.push(problem('unknown_flight_type', origin, m.flightType));
      }
    }

    const record = {
      ARP: icao,
      TYPMO: movementType(m),
      ACREG: m.immatriculation,
      TYPTR: typeOfTraffic,
      NUMMO: numberOfMovements(m),
      ORIDE: locationOf(m.location, input.aerodromes),
      PAX: m.passengerCount || 0,
      DATMO: m.date.replace(/-/g, ''),
      TIMMO: m.time.replace(/:/g, ''),
      PIMO: runwayOf(m),
      TYPPI: runwayType(m, runways),
      DIRDE: directionOfDeparture(m),
      CID: icao,
      CDT: creation.CDT,
      CDM: creation.CDM,
    };

    if (internal) {
      addInternalFields(record, m, input, memberManagement);
    }
    return record;
  });

  if (problems.length > 0) {
    throw new AirstatDataError(problems);
  }
  return records;
}

module.exports = { deriveAirstatRows, LOCATION_DEFAULT };
