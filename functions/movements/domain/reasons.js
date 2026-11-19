'use strict';

// Stable, machine-readable reasons returned by the movement domain. API
// clients may branch on them, so existing values must not change.
const REASONS = Object.freeze({
  // validateMovement: {field, reason}
  REQUIRED: 'required',
  UNKNOWN_FIELD: 'unknown-field',
  INVALID_KEY: 'invalid-key',
  NOT_A_STRING: 'not-a-string',
  NOT_A_NUMBER: 'not-a-number',
  NOT_AN_OBJECT: 'not-an-object',
  EMPTY: 'empty',
  TOO_LONG: 'too-long',
  INVALID_FORMAT: 'invalid-format',
  INVALID_PREFIX: 'invalid-prefix',
  NOT_ALLOWED: 'not-allowed',
  CIRCUITS_NOT_LOCAL: 'circuits-not-local',
  MUST_BE_POSITIVE: 'must-be-positive',
  MUST_NOT_BE_NEGATIVE: 'must-not-be-negative',
  MUST_BE_NEGATIVE: 'must-be-negative',
  // checkWriteAccess: {code, reason}
  UNAUTHENTICATED: 'unauthenticated',
  NOT_OWNER: 'not-owner',
  MOVEMENT_LOCKED: 'movement-locked',
  NOT_FOUND: 'not-found',
});

const CODES = Object.freeze({
  PERMISSION_DENIED: 'permission-denied',
  FAILED_PRECONDITION: 'failed-precondition',
});

module.exports = { REASONS, CODES };
