'use strict';

// Which movements a caller may list (GET /app/movements), as in the app:
// where access is shared (policy.personalAccess false) everyone sees all;
// otherwise admins and allMovements operators (the client's
// canSeeAllMovements, the rules' CAN_SEE_ALL_MOVEMENTS) see all, pilots only
// their own.
//
// The facts come from the repository (loadReaderFacts): the app user the
// caller is (the Firebase uid; for a caller of the central login the app
// user with the same verified e-mail, or null) and that user's /admins and
// /logins/<uid>/allMovements entries.

/**
 * Pure. facts: {appUid: string|null, admin: boolean, allMovements: boolean}.
 * Returns {all, uid}: whether the caller may list all movements, and the uid
 * to read as (for an all read the app user's, so the database rules see the
 * same uid as for the app).
 */
function readAccess(actor, policy, facts) {
  if (!policy.personalAccess) {
    return { all: true, uid: actor.uid };
  }
  if (typeof facts.appUid === 'string' && facts.appUid !== '' && (facts.admin === true || facts.allMovements === true)) {
    return { all: true, uid: facts.appUid };
  }
  return { all: false, uid: actor.uid };
}

module.exports = { readAccess };
