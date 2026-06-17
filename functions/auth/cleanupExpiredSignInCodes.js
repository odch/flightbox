'use strict';

const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

const MAX_ATTEMPTS = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour — matches generateSignInCode

exports.cleanupExpiredSignInCodes = onSchedule(
  { region: 'europe-west1', schedule: 'every 60 minutes' },
  async () => {
    const db = admin.database();
    const now = Date.now();

    const codesRef = db.ref('/signInCodes');
    const snapshot = await codesRef.once('value');

    if (snapshot.exists()) {
      const updates = {};
      snapshot.forEach(child => {
        const val = child.val();
        if (val.expiry <= now || val.attempts >= MAX_ATTEMPTS) {
          updates[child.key] = null;
        }
      });
      if (Object.keys(updates).length > 0) {
        await codesRef.update(updates);
      }
    }

    const rateLimitsRef = db.ref('/signInRateLimits');
    const rateLimitsSnapshot = await rateLimitsRef.once('value');

    if (rateLimitsSnapshot.exists()) {
      const updates = {};
      rateLimitsSnapshot.forEach(child => {
        const val = child.val();
        if (now - val.windowStart > RATE_WINDOW_MS) {
          updates[child.key] = null;
        }
      });
      if (Object.keys(updates).length > 0) {
        await rateLimitsRef.update(updates);
      }
    }
  }
);
