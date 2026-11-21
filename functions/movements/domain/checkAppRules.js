'use strict';

const { REASONS } = require('./reasons');
const { hasOwn } = require('./normalize');
// The server's one port of the client's flight type and category tables
// (with client parity tests, src/util/airstatOracles/tables.spec.js). It
// lives in the airstat engine, which may only load files of its own folder;
// depending on it from here costs nothing (pure data, no packages).
const { FLIGHT_TYPES, getAirstatType, isHelicopter } = require('../../reports/airstat/tables');

// What the app's wizard requires beyond the database rules, checked for
// writes through the API so that other clients (e.g. the Open Digital MCP
// hub) cannot record movements the app would not:
//  - a runway (src/components/wizards/validate.tsx), except for helicopters
//    where the aerodrome sets noRunwayIfHelicopter (the flight page
//    containers hide the field);
//  - a flight type the app offers for the aircraft category
//    (getEnabledFlightTypes in src/util/flightTypes.ts: the category's
//    aircraft type has an airstat code for it).
//
// Deliberately not in the database rules: movements stored before may lack a
// runway or have a flight type of another category. So a create checks the
// whole movement; an update only what it writes (the runway when runway or
// aircraftCategory is written, the flight type when flightType or
// aircraftCategory is). The app sends the whole movement when it edits one,
// which its wizard has checked the same way.

const isPresent = (movement, field) =>
  hasOwn(movement, field) && movement[field] !== null && movement[field] !== undefined;

const KNOWN_FLIGHT_TYPES = new Set(FLIGHT_TYPES.map(type => type.value));

/**
 * Pure. movement: the movement as it would be stored (prepareWrite);
 * writtenFields: the fields the write sets or removes; isCreate.
 * Returns [{field, reason}] like validateMovement.
 */
function checkAppRules(movement, policy, { writtenFields, isCreate }) {
  const written = field => isCreate || writtenFields.includes(field);
  const errors = [];
  const category = movement.aircraftCategory;

  if ((written('runway') || written('aircraftCategory')) && !isPresent(movement, 'runway')) {
    const exempt = policy.noRunwayIfHelicopter && isHelicopter(movement.immatriculation, category);
    if (!exempt) {
      errors.push({ field: 'runway', reason: REASONS.REQUIRED });
    }
  }

  // Unknown flight types and categories are validateMovement's (not-allowed).
  const flightType = movement.flightType;
  if ((written('flightType') || written('aircraftCategory'))
    && typeof flightType === 'string' && KNOWN_FLIGHT_TYPES.has(flightType)
    && typeof category === 'string' && policy.aircraftCategories.includes(category)
    && getAirstatType(flightType, category) === undefined) {
    errors.push({ field: 'flightType', reason: REASONS.NOT_FOR_AIRCRAFT_CATEGORY });
  }

  return errors;
}

module.exports = { checkAppRules };
