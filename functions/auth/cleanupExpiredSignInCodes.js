'use strict';

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getDatabase } = require('firebase-admin/database');

const MAX_ATTEMPTS = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour — matches generateSignInCode
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000; // matches generateSignInCode

exports.cleanupExpiredSignInCodes = onSchedule(
  { region: 'europe-west1', schedule: 'every 60 minutes' },
  async () => {
    const db = getDatabase();
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
        // Keep an entry until its daily window has passed too, or pruning it
        // would reset the daily cap every hour.
        const dayWindowOver = !val.dayWindowStart || now - val.dayWindowStart > DAY_WINDOW_MS;
        if (now - val.windowStart > RATE_WINDOW_MS && dayWindowOver) {
          updates[child.key] = null;
        }
      });
      if (Object.keys(updates).length > 0) {
        await rateLimitsRef.update(updates);
      }
    }

    // Static-login per-IP throttle entries share the same windowed shape; prune
    // those whose window has passed so the node cannot grow unbounded.
    const staticRateLimitsRef = db.ref('/staticAuthRateLimits');
    const staticRateLimitsSnapshot = await staticRateLimitsRef.once('value');

    if (staticRateLimitsSnapshot.exists()) {
      const updates = {};
      staticRateLimitsSnapshot.forEach(child => {
        const val = child.val();
        if (now - val.windowStart > RATE_WINDOW_MS) {
          updates[child.key] = null;
        }
      });
      if (Object.keys(updates).length > 0) {
        await staticRateLimitsRef.update(updates);
      }
    }
  }
);
