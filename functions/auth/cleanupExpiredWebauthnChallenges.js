'use strict';

const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

exports.cleanupExpiredWebauthnChallenges = onSchedule(
  { region: 'europe-west1', schedule: 'every 60 minutes' },
  async () => {
    const db = admin.database();
    const ref = db.ref('/webauthnChallenges');
    const now = Date.now();

    // Read only the expired records via the `expiry` index, rather than scanning
    // the whole node. `endAt(now)` returns records ordered up to `now`, which
    // covers numeric expiries in the past and any missing/null expiry (those
    // sort first); all of them are stale and should be removed. This keeps the
    // cleanup cost proportional to the expired set, not the total node size —
    // important when the (public) options endpoints are being flooded.
    const snapshot = await ref.orderByChild('expiry').endAt(now).once('value');

    if (!snapshot.exists()) {
      return;
    }

    const updates = {};
    snapshot.forEach(child => {
      updates[child.key] = null;
    });

    if (Object.keys(updates).length > 0) {
      await ref.update(updates);
    }
  }
);
