'use strict';

const { REASONS } = require('./reasons');
const { isPlainObject, hasOwn, ownValue } = require('./normalize');

// Mirrors the `.validate` rules of `departures/$id` and `arrivals/$id` in
// firebase-rules-template.json, as processed per project by
// tasks/processFirebaseRules.js. Like the database it validates:
//  - the required children on the whole resulting movement, on every write;
//  - each written field (and the $other whitelist) only when it is written:
//    the database does not re-validate stored siblings an update leaves
//    untouched, so a legacy value elsewhere in the movement does not block
//    e.g. setting the payment method.
// Removed fields (null) are not validated, as in the database.

const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const DURATION = /^\d{2}:\d{2}$/;
const EMAIL = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

const PAYMENT_METHODS = Object.freeze([
  'card', 'checkout', 'cash', 'card_external', 'twint_external', 'invoice',
]);

const CIRCUITS = 'circuits';

// Realtime Database keys: non-empty, at most 768 UTF-8 bytes, none of
// . $ # [ ] / and no ASCII control characters. The SDKs refuse such keys
// before the rules run; the Admin SDK writer must not get them either.
const INVALID_KEY_CHARS = /[.$#[\]/\u0000-\u001f\u007f]/;
const MAX_KEY_BYTES = 768;

// Deliberately stricter than the rules, which accept this key where extra
// children are allowed (inside paymentMethod; at the top level $other
// rejects it): no client sends it, and stored it would let any reader that
// copies keys with `object[key] = value` replace that object's prototype.
const PROTO_KEY = '__proto__';

// Pure JS (no Buffer/TextEncoder) so it runs unchanged in every runtime.
function utf8Length(text) {
  let bytes = 0;
  for (const char of text) {
    const codePoint = char.codePointAt(0);
    bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : codePoint < 0x10000 ? 3 : 4;
  }
  return bytes;
}

function isValidKey(key) {
  return key !== ''
    && key !== PROTO_KEY
    && !INVALID_KEY_CHARS.test(key)
    && utf8Length(key) <= MAX_KEY_BYTES;
}

function hasOnlyValidKeys(value) {
  if (!isPlainObject(value)) {
    return true;
  }
  return Object.keys(value).every(key => isValidKey(key) && hasOnlyValidKeys(value[key]));
}

// Field checks. Each returns null when the value passes, else a reason or a
// list of {field, reason} for nested fields.

const string = (maxLength, { nonEmpty = false } = {}) => value => {
  if (typeof value !== 'string') {
    return REASONS.NOT_A_STRING;
  }
  if (value.length > maxLength) {
    return REASONS.TOO_LONG;
  }
  if (nonEmpty && value.length === 0) {
    return REASONS.EMPTY;
  }
  return null;
};

const matching = (pattern, maxLength = Infinity) => value => {
  if (typeof value !== 'string') {
    return REASONS.NOT_A_STRING;
  }
  if (value.length > maxLength) {
    return REASONS.TOO_LONG;
  }
  return pattern.test(value) ? null : REASONS.INVALID_FORMAT;
};

const number = (test = () => true, reason = null) => value => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return REASONS.NOT_A_NUMBER;
  }
  return test(value) ? null : reason;
};

const positive = number(value => value > 0, REASONS.MUST_BE_POSITIVE);
const notNegative = number(value => value >= 0, REASONS.MUST_NOT_BE_NEGATIVE);
const negative = number(value => value < 0, REASONS.MUST_BE_NEGATIVE);
const anyNumber = number();

const oneOf = listOf => (value, { policy }) =>
  (listOf(policy).includes(value) ? null : REASONS.NOT_ALLOWED);

// 'circuits' is always allowed for a movement from/to this aerodrome itself
// (processFirebaseRules.js processRoute).
const route = listOf => (value, { movement, policy }) => {
  if (listOf(policy).includes(value)) {
    return null;
  }
  if (value !== CIRCUITS) {
    return REASONS.NOT_ALLOWED;
  }
  const location = ownValue(movement, 'location');
  return typeof location === 'string' && location.toUpperCase() === policy.icao
    ? null
    : REASONS.CIRCUITS_NOT_LOCAL;
};

// A carriage voucher answer is only required with passengers; without
// passengers the rule accepts any value.
const carriageVoucher = (value, { movement }) =>
  (ownValue(movement, 'passengerCount') === 0 || value === 'yes' || value === 'no' ? null : REASONS.NOT_ALLOWED);

const customsFormUrlLength = string(512);

const customsFormUrl = (value, { context }) => {
  const lengthReason = customsFormUrlLength(value);
  if (lengthReason) {
    return lengthReason;
  }
  const baseUrl = context.customsBaseUrl;
  if (baseUrl === undefined || baseUrl === null) {
    return null;
  }
  return typeof baseUrl === 'string' && value.startsWith(baseUrl) ? null : REASONS.INVALID_PREFIX;
};

const invoiceRecipientName = string(200);

// Children other than method and invoiceRecipientName are allowed (the
// client adds `status: 'pending'` for online payments).
const paymentMethod = value => {
  if (!isPlainObject(value)) {
    return REASONS.NOT_AN_OBJECT;
  }
  const errors = [];
  if (!hasOwn(value, 'method')) {
    errors.push({ field: 'paymentMethod.method', reason: REASONS.REQUIRED });
  } else if (!PAYMENT_METHODS.includes(value.method)) {
    errors.push({ field: 'paymentMethod.method', reason: REASONS.NOT_ALLOWED });
  }
  if (hasOwn(value, 'invoiceRecipientName')) {
    const reason = invoiceRecipientName(value.invoiceRecipientName);
    if (reason) {
      errors.push({ field: 'paymentMethod.invoiceRecipientName', reason });
    }
  }
  return errors.length > 0 ? errors : null;
};

const COMMON_FIELDS = {
  aircraftType: string(20, { nonEmpty: true }),
  dateTime: matching(ISO_DATE_TIME),
  email: matching(EMAIL, 254),
  firstname: string(100, { nonEmpty: true }),
  flightType: oneOf(policy => policy.flightTypes),
  immatriculation: string(20, { nonEmpty: true }),
  lastname: string(100, { nonEmpty: true }),
  location: string(100, { nonEmpty: true }),
  locationName: string(200),
  locationCountry: string(100),
  locationTimezone: string(100),
  memberNr: string(50),
  mtow: positive,
  aircraftCategory: oneOf(policy => policy.aircraftCategories),
  negativeTimestamp: negative,
  passengerCount: notNegative,
  phone: string(30),
  remarks: string(2000),
  runway: oneOf(policy => policy.runways),
  createdBy: string(254),
  createdBy_orderKey: string(320),
  customsFormId: string(200),
  customsFormUrl,
  privacyPolicyAcceptedAt: matching(ISO_DATE_TIME),
};

const SCHEMAS = {
  departure: {
    required: [
      'aircraftType', 'dateTime', 'departureRoute', 'duration', 'email',
      'firstname', 'flightType', 'immatriculation', 'lastname', 'location',
      'mtow', 'aircraftCategory', 'negativeTimestamp',
    ],
    fields: {
      ...COMMON_FIELDS,
      carriageVoucher,
      departureRoute: route(policy => policy.departureRoutes),
      duration: matching(DURATION),
      route: string(500),
    },
  },
  arrival: {
    required: [
      'aircraftType', 'arrivalRoute', 'dateTime', 'email', 'firstname',
      'flightType', 'immatriculation', 'landingCount', 'lastname', 'location',
      'mtow', 'aircraftCategory', 'negativeTimestamp',
    ],
    fields: {
      ...COMMON_FIELDS,
      arrivalRoute: route(policy => policy.arrivalRoutes),
      goAroundCount: notNegative,
      goAroundFeeSingle: notNegative,
      goAroundFeeCode: string(50, { nonEmpty: true }),
      goAroundFeeTotal: notNegative,
      landingCount: positive,
      landingFeeSingle: notNegative,
      landingFeeCode: string(50, { nonEmpty: true }),
      landingFeeTotal: notNegative,
      feeTotalNet: anyNumber,
      feeVat: anyNumber,
      feeRoundingDifference: anyNumber,
      feeTotalGross: anyNumber,
      paymentMethod,
    },
  },
};

const MOVEMENT_TYPES = Object.freeze(Object.keys(SCHEMAS));

function schemaFor(type) {
  if (!hasOwn(SCHEMAS, type)) {
    throw new TypeError(`Unknown movement type: ${JSON.stringify(type)}`);
  }
  return SCHEMAS[type];
}

const isPresent = (movement, field) =>
  hasOwn(movement, field) && movement[field] !== null && movement[field] !== undefined;

function missingRequired(schema, movement) {
  return schema.required
    .filter(field => !isPresent(movement, field))
    .map(field => ({ field, reason: REASONS.REQUIRED }));
}

function checkField(schema, field, args) {
  // Own properties only: a field named like an Object.prototype member
  // (toString, constructor, ...) is an unknown field, not a check.
  const check = ownValue(schema.fields, field);
  if (!check) {
    return [{ field, reason: REASONS.UNKNOWN_FIELD }];
  }
  const value = args.movement[field];
  if (!hasOnlyValidKeys(value)) {
    return [{ field, reason: REASONS.INVALID_KEY }];
  }
  const result = check(value, args);
  if (result === null) {
    return [];
  }
  return Array.isArray(result) ? result : [{ field, reason: result }];
}

/**
 * Pure. `movement` is the whole movement as it would be stored (see
 * prepareWrite), `policy` comes from buildMovementPolicy. `context`:
 *  - customsBaseUrl: settings/customsDeclarationApp/baseUrl, if configured;
 *  - writtenFields: the top-level fields this write sets or removes; omitted,
 *    every field of the movement counts as written (a create).
 * Returns a list of {field, reason}, empty when the movement is valid.
 */
function validateMovement(type, movement, policy, context = {}) {
  const schema = schemaFor(type);
  if (!isPlainObject(movement)) {
    throw new TypeError('movement must be an object');
  }
  const written = context.writtenFields === undefined
    ? Object.keys(movement)
    : [...new Set(context.writtenFields)];
  const args = { movement, policy, context };
  const fieldErrors = written
    .filter(field => isPresent(movement, field))
    .sort()
    .flatMap(field => checkField(schema, field, args));
  return [...missingRequired(schema, movement), ...fieldErrors];
}

module.exports = { validateMovement, MOVEMENT_TYPES, PAYMENT_METHODS };
