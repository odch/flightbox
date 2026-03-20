'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const SCHEDULE = '0 2 * * *'; // Every day at 2 AM
const TIMEZONE = 'Europe/Zurich';

exports.scheduledCleanupMessages = functions
  .region('europe-west1')
  .pubsub
  .schedule(SCHEDULE)
  .timeZone(TIMEZONE)
  .onRun(async () => {
    const db = admin.database();

    const retentionSnap = await db.ref('/settings/messageRetentionDays').once('value');
    const retentionDays = retentionSnap.val();

    if (!retentionDays) {
      console.log('No messageRetentionDays configured, skipping');
      return;
    }

    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    console.log(`Deleting messages older than ${new Date(cutoff).toISOString()} (retention: ${retentionDays} days)`);

    const snapshot = await db.ref('/messages').once('value');

    if (!snapshot.exists()) {
      console.log('No messages to delete');
      return;
    }

    const updates = {};

    snapshot.forEach(child => {
      const val = child.val();
      if (val.timestamp <= cutoff) {
        updates[child.key] = null;
      }
    });

    const count = Object.keys(updates).length;

    if (count > 0) {
      await db.ref('/messages').update(updates);
      console.log(`Deleted ${count} messages`);
    }
  });
