'use strict';

const { toReadView, isOwnMovement } = require('../domain/readView');

// Use case: the movements of a period for a caller (GET /app/movements),
// for API clients such as the Open Digital MCP hub; the app reads the
// database directly.
//
// Repository port (functions/movements/adapters/rtdbMovementRepository.js):
//   resolveReader(actor, policy)                  -> {all, authOverride}
//   listMovements(type, {fromMs, toMs, owner, limit}, authOverride)
//                                                 -> [[key, movement]], newest first
//
// As in the app: pilots get their own movements; admins and allMovements
// operators (and everyone where access is shared) all of them, those of
// others without personal data (domain/readView.js).

const MAX_PER_TYPE = 200;
const TYPES = Object.freeze(['departure', 'arrival']);

const timestampOf = (movement) => -movement.negativeTimestamp;

/**
 * from, to: ms since the epoch (from <= to); types: subset of TYPES.
 * Resolves with {movements: [view], truncated}, views sorted by dateTime.
 */
async function listMovements({ repository, policy, actor, fromMs, toMs, types = TYPES, limit = MAX_PER_TYPE }) {
  const reader = await repository.resolveReader(actor, policy);
  // Without the right to see all, only movements created with the caller's
  // e-mail; a caller without one (guest, kiosk) has none.
  if (!reader.all && !actor.email) {
    return { movements: [], truncated: false };
  }
  const owner = reader.all ? null : actor.email;

  let truncated = false;
  const lists = await Promise.all(types.map(async (type) => {
    const entries = await repository.listMovements(type, { fromMs, toMs, owner, limit: limit + 1 }, reader.authOverride);
    if (entries.length > limit) {
      truncated = true;
    }
    return entries
      .slice(0, limit)
      // The query bounds already do this; a second check costs nothing.
      .filter(([, movement]) => typeof movement.negativeTimestamp === 'number'
        && timestampOf(movement) >= fromMs && timestampOf(movement) <= toMs
        && (reader.all || isOwnMovement(movement, actor.email)))
      .map(([key, movement]) => toReadView(type, key, movement, actor.email));
  }));

  const movements = lists.flat().sort((a, b) => String(a.dateTime).localeCompare(String(b.dateTime)));
  return { movements, truncated };
}

module.exports = { listMovements, MAX_PER_TYPE, TYPES };
