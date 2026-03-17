'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

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
      if (child.val().expiry <= now) {
        updates[child.key] = null;
      }
    });

    if (Object.keys(updates).length > 0) {
      await codesRef.update(updates);
    }
  });
