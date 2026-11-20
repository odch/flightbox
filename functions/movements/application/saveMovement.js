'use strict';

const {
  prepareWrite,
  validateMovement,
  checkAppRules,
  checkWriteAccess,
  CODES,
} = require('../domain');

// Use case: create or update (merge) a movement on behalf of an actor.
//
// Repository port (functions/movements/adapters/rtdbMovementRepository.js):
//   findMovement(type, key)                 -> stored movement | null
//   loadWriteSettings()                     -> {lockDate, lockDateIso, customsBaseUrl}
//   createMovement(type, movement, actor)   -> new key
//   updateMovement(type, key, patch, actor) -> void
// The write methods write as the actor; they reject with a
// RulesRejectedError (adapters/databaseRest.js) when the database rules deny
// what the domain accepted.

const OUTCOMES = Object.freeze({
  NOT_FOUND: 'not-found',
  INVALID: 'invalid-argument',
});

const reject = (code, details) => ({ ok: false, code, ...details });

// Validation errors are reported before a lock (so a create without dateTime
// is a 400, not a 409), but never to a caller that may not touch the
// movement at all: they would describe a movement the caller cannot read.
function decide({ errors, access }) {
  if (!access.ok && access.code === CODES.PERMISSION_DENIED) {
    return reject(access.code, { reason: access.reason });
  }
  if (errors.length > 0) {
    return reject(OUTCOMES.INVALID, { validationErrors: errors });
  }
  if (!access.ok) {
    return reject(access.code, { reason: access.reason });
  }
  return null;
}

/**
 * type:  'departure' | 'arrival';
 * key:   the movement to update, or null to create one;
 * input: the client's fields (a plain object), merged like RTDB update().
 * Resolves with {ok: true, key, created} or {ok: false, code, reason?,
 * validationErrors?}, code being 'not-found', 'invalid-argument',
 * 'permission-denied' or 'failed-precondition'.
 */
async function saveMovement({ repository, policy, actor, type, key = null, input }) {
  const isCreate = key === null;
  const [existing, settings] = await Promise.all([
    isCreate ? null : repository.findMovement(type, key),
    repository.loadWriteSettings(),
  ]);
  if (!isCreate && existing === null) {
    return reject(OUTCOMES.NOT_FOUND, { reason: OUTCOMES.NOT_FOUND });
  }

  const prepared = prepareWrite({ type, actor, existing, input });
  const errors = [
    ...validateMovement(type, prepared.movement, policy, {
      writtenFields: prepared.writtenFields,
      customsBaseUrl: settings.customsBaseUrl,
    }),
    // What the app's wizard requires beyond the database rules.
    ...checkAppRules(prepared.movement, policy, { writtenFields: prepared.writtenFields, isCreate }),
  ];
  const access = checkWriteAccess({ actor, existing, next: prepared.movement, policy, settings });
  const rejection = decide({ errors, access });
  if (rejection) {
    return rejection;
  }

  if (isCreate) {
    const newKey = await repository.createMovement(type, prepared.movement, actor);
    return { ok: true, key: newKey, created: true };
  }
  await repository.updateMovement(type, key, prepared.patch, actor);
  return { ok: true, key, created: false };
}

module.exports = { saveMovement, OUTCOMES };
