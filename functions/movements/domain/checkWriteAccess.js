'use strict';

const { REASONS, CODES } = require('./reasons');
const { ownValue } = require('./normalize');

// Mirrors the `.write` rule of `departures/$id` and `arrivals/$id`:
//   auth !== null && ({movementLock}){movementOwnership}
// as built by tasks/processFirebaseRules.js (processMovementLock,
// processMovementOwnership).
//
// actor:    {uid, email, isAdmin} of the authenticated caller, or null.
//           isAdmin is `/admins/<uid> === true`, resolved by the caller.
// existing: the stored movement, or null for a create.
// next:     the movement as it will be stored (prepareWrite), or null for a
//           delete.
// settings: {lockDate, lockDateIso} from /settings (absent = undefined/null).

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

const GUEST_UIDS = Object.freeze(['guest', 'kiosk']);

const ALLOWED = Object.freeze({ ok: true });

const deny = (code, reason) => Object.freeze({ ok: false, code, reason });

const exists = value => value !== undefined && value !== null;

// Movement fields are read as own properties only, like the stored children
// the rules read.
const hasOwner = movement => exists(ownValue(movement, 'createdBy'));

// `auth.token.email` is null for tokens without an e-mail (guest, kiosk).
const isOwnedBy = (movement, email) => hasOwner(movement) && ownValue(movement, 'createdBy') === email;

function isOwnershipAllowed({ actor, existing, next }) {
  if (actor.isAdmin === true) {
    return true;
  }
  const email = exists(actor.email) ? actor.email : null;
  const isGuestOrKiosk = GUEST_UIDS.includes(actor.uid);
  if (!existing) {
    // Pilots create movements they own; guest/kiosk only ownerless ones.
    return isOwnedBy(next, email) || (isGuestOrKiosk && !hasOwner(next));
  }
  if (!next) {
    // Guest/kiosk never delete, not even ownerless movements.
    return isOwnedBy(existing, email);
  }
  return (isOwnedBy(existing, email) && isOwnedBy(next, email))
    || (isGuestOrKiosk && !hasOwner(existing) && !hasOwner(next));
}

// `negativeTimestamp * -1 > lockDate + one day`; any non-number operand fails
// the rule (an evaluation error denies the write).
function isOutsideNumericLock(movement, settings) {
  const negativeTimestamp = ownValue(movement, 'negativeTimestamp');
  const { lockDate } = settings;
  return typeof negativeTimestamp === 'number'
    && typeof lockDate === 'number'
    && negativeTimestamp * -1 > lockDate + ONE_DAY_MS;
}

// lockOnDateTime: compare the ISO dateTime with the server-derived
// settings/lockDateIso, falling back to the numeric test while it is absent.
function isOutsideDateTimeLock(movement, settings) {
  const { lockDateIso } = settings;
  if (!exists(lockDateIso)) {
    return isOutsideNumericLock(movement, settings);
  }
  const dateTime = ownValue(movement, 'dateTime');
  return typeof dateTime === 'string'
    && typeof lockDateIso === 'string'
    && dateTime > lockDateIso;
}

function isLockAllowed({ existing, next, policy, settings }) {
  if (!exists(settings.lockDate)) {
    return true;
  }
  const isOutside = policy.lockOnDateTime ? isOutsideDateTimeLock : isOutsideNumericLock;
  return (!existing || isOutside(existing, settings)) && (!next || isOutside(next, settings));
}

const isAuthenticated = actor =>
  actor !== null && typeof actor === 'object' && typeof actor.uid === 'string' && actor.uid !== '';

/**
 * Pure. Returns {ok: true}, or {ok: false, code, reason} with code
 * 'permission-denied' (not signed in, not the owner) or 'failed-precondition'
 * (movement locked, nothing to write). Ownership is checked before the lock
 * so a caller learns nothing about movements it may not touch.
 */
function checkWriteAccess({ actor, existing = null, next = null, policy, settings = {} }) {
  if (!isAuthenticated(actor)) {
    return deny(CODES.PERMISSION_DENIED, REASONS.UNAUTHENTICATED);
  }
  if (!existing && !next) {
    // Deleting a movement that does not exist. The rules would treat it as a
    // no-op write; the domain reports it so the caller can answer 404.
    return deny(CODES.FAILED_PRECONDITION, REASONS.NOT_FOUND);
  }
  const args = { actor, existing, next, policy, settings: settings || {} };
  if (policy.personalAccess && !isOwnershipAllowed(args)) {
    return deny(CODES.PERMISSION_DENIED, REASONS.NOT_OWNER);
  }
  if (!isLockAllowed(args)) {
    return deny(CODES.FAILED_PRECONDITION, REASONS.MOVEMENT_LOCKED);
  }
  return ALLOWED;
}

module.exports = { checkWriteAccess, ONE_DAY_MS };
