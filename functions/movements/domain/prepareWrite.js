'use strict';

const { normalizeValue, isPlainObject, hasOwn, ownValue, setOwn } = require('./normalize');
const { toOrderKey } = require('./orderKey');
const { MOVEMENT_TYPES } = require('./validateMovement');

// Fields only the server sets; client values for them are ignored.
const SERVER_OWNED = Object.freeze(['negativeTimestamp', 'createdBy', 'createdBy_orderKey']);

// Rewritten on every write, from dateTime and createdBy.
const DERIVED = Object.freeze(['negativeTimestamp', 'createdBy_orderKey']);

const hasEmail = actor =>
  actor !== null && typeof actor === 'object' && typeof actor.email === 'string' && actor.email !== '';

function clientFields(input) {
  return Object.keys(input).filter(field => !SERVER_OWNED.includes(field));
}

// RTDB update() semantics: each top-level key of the input replaces the
// stored value, a null (or empty) value removes it.
function merge(base, input, fields) {
  const movement = { ...base };
  fields.forEach(field => {
    const value = normalizeValue(input[field]);
    if (value === null) {
      delete movement[field];
    } else {
      setOwn(movement, field, value);
    }
  });
  return movement;
}

// Always derived from dateTime, never taken from the client: the numeric lock
// rule tests negativeTimestamp, so a client could otherwise pass the lock with
// a recent negativeTimestamp and a backdated dateTime. An unparseable dateTime
// leaves it unset, which validateMovement reports as missing.
function deriveNegativeTimestamp(movement) {
  const dateTime = ownValue(movement, 'dateTime');
  const timestamp = typeof dateTime === 'string' ? Date.parse(dateTime) : NaN;
  if (Number.isNaN(timestamp)) {
    delete movement.negativeTimestamp;
  } else {
    movement.negativeTimestamp = -timestamp;
  }
}

function deriveOrderKey(movement) {
  const createdBy = ownValue(movement, 'createdBy');
  const negativeTimestamp = ownValue(movement, 'negativeTimestamp');
  if (typeof createdBy === 'string' && typeof negativeTimestamp === 'number') {
    movement.createdBy_orderKey = toOrderKey(createdBy, negativeTimestamp);
  } else {
    delete movement.createdBy_orderKey;
  }
}

// The fields an RTDB update() of `writtenFields` would send: removed fields
// as null.
function toPatch(movement, writtenFields) {
  const patch = {};
  writtenFields.forEach(field => {
    setOwn(patch, field, hasOwn(movement, field) ? movement[field] : null);
  });
  return patch;
}

/**
 * Pure. Builds the movement as it will be stored from the client input.
 *  - create (no existing): the input's fields; createdBy is the actor's
 *    e-mail when it has one (guest/kiosk: ownerless), like the client does;
 *  - update: input merged over the stored movement (top-level keys replaced,
 *    null removes); createdBy stays as stored.
 * negativeTimestamp and createdBy_orderKey are derived on every write.
 * Returns {movement, writtenFields, patch}: writtenFields are the top-level
 * fields the write sets or removes (for validateMovement), patch is what an
 * update() of them sends (equal to movement for a create).
 */
function prepareWrite({ type, actor, existing = null, input }) {
  if (!MOVEMENT_TYPES.includes(type)) {
    throw new TypeError(`Unknown movement type: ${JSON.stringify(type)}`);
  }
  if (!isPlainObject(input)) {
    throw new TypeError('input must be an object');
  }
  if (existing !== null && !isPlainObject(existing)) {
    throw new TypeError('existing must be an object or null');
  }
  const fields = clientFields(input);
  const isCreate = existing === null;
  const movement = merge(isCreate ? {} : existing, input, fields);

  // On an update createdBy is whatever is stored: the input cannot touch it
  // (SERVER_OWNED), so merge() kept it.
  if (isCreate && hasEmail(actor)) {
    movement.createdBy = actor.email;
  }
  deriveNegativeTimestamp(movement);
  deriveOrderKey(movement);

  const writtenFields = isCreate
    ? Object.keys(movement)
    : [...new Set([...fields, ...DERIVED])];
  return {
    movement,
    writtenFields,
    patch: isCreate ? { ...movement } : toPatch(movement, writtenFields),
  };
}

module.exports = { prepareWrite, SERVER_OWNED };
