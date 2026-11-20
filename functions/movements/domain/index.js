'use strict';

// Movement domain core: pure functions, no Firebase. Mirrors the movement
// write rules of the Realtime Database (firebase-rules-template.json as
// processed by tasks/processFirebaseRules.js) so that movement writes can go
// through the API (flag `movementWritesViaApi`) with the same outcome.
// checkAppRules adds, for the API only, what the app's wizard requires
// beyond the rules.

const { buildMovementPolicy } = require('./policy');
const { validateMovement, MOVEMENT_TYPES, PAYMENT_METHODS } = require('./validateMovement');
const { checkWriteAccess } = require('./checkWriteAccess');
const { checkAppRules } = require('./checkAppRules');
const { prepareWrite, SERVER_OWNED } = require('./prepareWrite');
const { toOrderKey } = require('./orderKey');
const { REASONS, CODES } = require('./reasons');

module.exports = {
  buildMovementPolicy,
  validateMovement,
  checkWriteAccess,
  checkAppRules,
  prepareWrite,
  toOrderKey,
  MOVEMENT_TYPES,
  PAYMENT_METHODS,
  SERVER_OWNED,
  REASONS,
  CODES,
};
