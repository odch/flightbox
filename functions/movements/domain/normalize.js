'use strict';

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

// A field as the database would store it: own properties only, never one
// inherited through the prototype chain.
const ownValue = (object, key) => (hasOwn(object, key) ? object[key] : undefined);

// Defines `key` as plain data. `object[key] = value` would call the
// `__proto__` setter for a "__proto__" key (JSON.parse, and so the API's
// JSON body parser, gives an own key of that name) and replace the object's
// prototype instead of storing the value, so the checks would read values
// that never get stored. Kept as data, validateMovement rejects such a key.
function setOwn(object, key, value) {
  Object.defineProperty(object, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

// Brings a JSON value into the shape the Realtime Database stores: null and
// empty objects mean "no value", arrays become index-keyed objects. Movement
// checks run on this shape so they see what the database rules would see
// (e.g. `paymentMethod: {}` removes the payment method, it is not an empty
// one). Returns null for "no value".
function normalizeValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'object') {
    return value;
  }
  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item])
    : Object.entries(value);
  const result = {};
  entries.forEach(([key, item]) => {
    const normalized = normalizeValue(item);
    if (normalized !== null) {
      setOwn(result, key, normalized);
    }
  });
  return Object.keys(result).length > 0 ? result : null;
}

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

module.exports = { normalizeValue, isPlainObject, hasOwn, ownValue, setOwn };
