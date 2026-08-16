'use strict';

const { onValueWritten } = require('firebase-functions/v2/database');
const { logger } = require('firebase-functions/v2');
const { defineString } = require('firebase-functions/params');
const admin = require('firebase-admin');

const RTDB_INSTANCE = defineString('RTDB_INSTANCE');
const RTDB_REGION = defineString('RTDB_REGION', { default: 'europe-west1' });

const instanceOpt = `{{ params.${RTDB_INSTANCE.name} }}`;
const regionOpt = `{{ params.${RTDB_REGION.name} }}`;

// Kiosk and guest access use a fixed Firebase uid ('kiosk' / 'guest') and a
// shared access token stored in the database. Rotating that token stops it
// minting new sessions, but sessions already signed in keep working until their
// refresh token is revoked. Revoking on rotation is the whole point of rotating
// the token, so whenever the stored access token changes we revoke the fixed
// uid's refresh tokens; existing sessions then fail on their next (<=1h) token
// refresh.
async function revokeIfTokenChanged(event, uid) {
  const before = event.data.before.val();
  const after = event.data.after.val();

  if (before === after) {
    logger.info(`Access token for '${uid}' unchanged; nothing to revoke.`);
    return;
  }

  await admin.auth().revokeRefreshTokens(uid);
  logger.info(`Access token for '${uid}' rotated; revoked existing refresh tokens.`);
}

module.exports.revokeKioskSessionsOnTokenRotation = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: '/settings/kioskAccessToken' },
  event => revokeIfTokenChanged(event, 'kiosk')
);

module.exports.revokeGuestSessionsOnTokenRotation = onValueWritten(
  { region: regionOpt, instance: instanceOpt, ref: '/settings/guestAccessToken' },
  event => revokeIfTokenChanged(event, 'guest')
);
