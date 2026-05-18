'use strict';

const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

exports.cleanupExpiredWebauthnChallenges = onSchedule(
  { region: 'europe-west1', schedule: 'every 60 minutes' },
  async () => {
    const db = admin.database();
    const ref = db.ref('/webauthnChallenges');
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) {
      return;
    }

    const updates = {};
    const now = Date.now();

    snapshot.forEach(child => {
      const val = child.val() || {};
      if (typeof val.expiry !== 'number' || val.expiry <= now) {
        updates[child.key] = null;
      }
    });

    if (Object.keys(updates).length > 0) {
      await ref.update(updates);
    }
  }
);
