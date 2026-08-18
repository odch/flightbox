'use strict';

const { onValueWritten } = require('firebase-functions/v2/database');
const { logger } = require('firebase-functions/v2');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');

const RTDB_INSTANCE = defineString('RTDB_INSTANCE');
const RTDB_REGION = defineString('RTDB_REGION', { default: 'europe-west1' });

const instanceOpt = `{{ params.${RTDB_INSTANCE.name} }}`;
const regionOpt = `{{ params.${RTDB_REGION.name} }}`;

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Mirror the movement lock threshold onto an ISO string the security rules can
 * compare against.
 *
 * A movement is locked when its instant is on/before `settings/lockDate` (plus
 * the existing one-day grace). The lock rule can only compare the ISO `dateTime`
 * string a movement actually stores against another ISO string — it cannot
 * convert the client-supplied numeric `negativeTimestamp` — so the previous rule
 * keyed off a field nothing tied to `dateTime`, which let a direct DB writer
 * backdate a record into a frozen period. This derives the threshold as an ISO
 * string server-side (trustworthy, always in sync with lockDate) so the rule can
 * lock on `dateTime` itself.
 *
 * Gated by `/settings/lockOnDateTime`: absent → no-op, so the derived field is
 * only ever written on projects that opt in (the lspl pilot). ISO-UTC strings of
 * fixed width sort lexicographically = chronologically, matching the `dateTime`
 * regex, so the rule comparison is exact.
 */
async function deriveLockDateIso(event) {
  const db = admin.database();

  const enabled = (await db.ref('/settings/lockOnDateTime').once('value')).val();
  if (enabled !== true) {
    return; // project not on dateTime-based locking
  }

  const after = event.data.after;
  const isoRef = db.ref('/settings/lockDateIso');
  const current = (await isoRef.once('value')).val();

  if (!after.exists()) {
    // lockDate cleared -> clear the mirror so no stale threshold lingers.
    if (current !== null) {
      await isoRef.set(null);
      logger.info('Cleared settings/lockDateIso (lockDate removed)');
    }
    return;
  }

  const lockDate = after.val();
  if (typeof lockDate !== 'number') {
    logger.warn(`settings/lockDate is ${typeof lockDate}, not a number; not deriving lockDateIso`);
    return;
  }

  const iso = new Date(lockDate + ONE_DAY_MS).toISOString();
  if (current === iso) {
    return; // already in sync
  }

  await isoRef.set(iso);
  logger.info(`Derived settings/lockDateIso=${iso} from lockDate=${lockDate}`);
}

exports.deriveLockDateIsoOnWrite = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: '/settings/lockDate' },
  deriveLockDateIso
);

exports._test = { deriveLockDateIso, ONE_DAY_MS };
