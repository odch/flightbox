'use strict';

const { hasOwn, isPlainObject } = require('./normalize');

// What the movement API returns of a stored movement (GET /app/movements).
//
// The caller's own movements (createdBy is the caller's e-mail) come with
// all their fields except the index fields. Movements of others, which only
// admins and allMovements operators get (rtdbMovementRepository.js
// resolveReader), carry no personal data: only the operational fields below.
// Whitelisted, so a field added to movements later stays out until it is
// listed here. Not listed on purpose: firstname, lastname, email, phone,
// memberNr, createdBy, remarks and route (free text), the customs form
// (customsFormId, customsFormUrl), privacyPolicyAcceptedAt, and of the payment
// method the invoice recipient.

const INTERNAL_FIELDS = Object.freeze(['negativeTimestamp', 'createdBy_orderKey']);

const OPERATIONAL_FIELDS = Object.freeze([
  'dateTime',
  'immatriculation',
  'aircraftType',
  'aircraftCategory',
  'mtow',
  'flightType',
  'location',
  'locationName',
  'locationCountry',
  'departureRoute',
  'arrivalRoute',
  'runway',
  'duration',
  'landingCount',
  'goAroundCount',
  'passengerCount',
  'landingFeeSingle',
  'landingFeeCode',
  'landingFeeTotal',
  'goAroundFeeSingle',
  'goAroundFeeCode',
  'goAroundFeeTotal',
  'feeTotalNet',
  'feeVat',
  'feeRoundingDifference',
  'feeTotalGross',
  'aircraftDataSource',
]);

const PAYMENT_FIELDS = Object.freeze(['method', 'status']);

const normalizedEmail = value => (typeof value === 'string' && value !== '' ? value.toLowerCase() : null);

/** Whether `movement` belongs to the caller with this e-mail. */
function isOwnMovement(movement, email) {
  const caller = normalizedEmail(email);
  return caller !== null && normalizedEmail(movement && movement.createdBy) === caller;
}

function pick(object, fields) {
  const result = {};
  fields.forEach(field => {
    if (hasOwn(object, field) && object[field] !== null && object[field] !== undefined) {
      result[field] = object[field];
    }
  });
  return result;
}

/**
 * Pure. The view of the stored `movement` (key `key`, 'departure' or
 * 'arrival') for the caller with the e-mail `email` (or null):
 * {type, key, own, ...fields}.
 */
function toReadView(type, key, movement, email) {
  const own = isOwnMovement(movement, email);
  let fields;
  if (own) {
    fields = { ...movement };
    INTERNAL_FIELDS.forEach(field => delete fields[field]);
  } else {
    fields = pick(movement, OPERATIONAL_FIELDS);
    if (isPlainObject(movement.paymentMethod)) {
      const payment = pick(movement.paymentMethod, PAYMENT_FIELDS);
      if (Object.keys(payment).length > 0) {
        fields.paymentMethod = payment;
      }
    }
  }
  return { type, key, own, ...fields };
}

module.exports = { toReadView, isOwnMovement, OPERATIONAL_FIELDS, INTERNAL_FIELDS };
