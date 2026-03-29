'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const MAX_ATTEMPTS = 5;

exports.cleanupExpiredSignInCodes = functions
  .region('europe-west1')
  .pubsub
  .schedule('every 60 minutes')
  .onRun(async () => {
    const db = admin.database();
    const codesRef = db.ref('/signInCodes');
    const snapshot = await codesRef.once('value');

    if (!snapshot.exists()) {
      return;
    }

    const updates = {};
    const now = Date.now();

    snapshot.forEach(child => {
      const val = child.val();
      if (val.expiry <= now || val.attempts >= MAX_ATTEMPTS) {
        updates[child.key] = null;
      }
    });

    if (Object.keys(updates).length > 0) {
      await codesRef.update(updates);
    }
  });
