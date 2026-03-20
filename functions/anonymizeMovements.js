'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const SCHEDULE = '0 2 * * *'; // Every day at 2 AM
const TIMEZONE = 'Europe/Zurich';

const PII_FIELDS = [
  'firstname',
  'lastname',
  'email',
  'phone',
  'memberNr',
  'immatriculation',
  'aircraftType',
  'mtow',
  'remarks',
  'carriageVoucher',
  'createdBy',
  'createdBy_orderKey',
  'customsFormId',
  'customsFormUrl',
];

function getAnonymizationUpdates(snapshot, cutoffIso) {
  const updates = {};

  snapshot.forEach(child => {
    const val = child.val();

    if (val.dateTime < cutoffIso && !val.anonymized) {
      PII_FIELDS.forEach(field => {
        if (val[field] !== undefined) {
          updates[`${child.key}/${field}`] = null;
        }
      });
      updates[`${child.key}/anonymized`] = true;
    }
  });

  return updates;
}

exports.scheduledAnonymizeMovements = functions
  .region('europe-west1')
  .pubsub
  .schedule(SCHEDULE)
  .timeZone(TIMEZONE)
  .onRun(async () => {
    const db = admin.database();

    const retentionSnap = await db.ref('/settings/movementRetentionDays').once('value');
    const retentionDays = retentionSnap.val();

    if (!retentionDays) {
      console.log('No movementRetentionDays configured, skipping');
      return;
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    const cutoffIso = cutoff.toISOString();

    console.log(`Anonymizing movements older than ${cutoffIso} (retention: ${retentionDays} days)`);

    const departuresSnap = await db.ref('/departures')
      .orderByChild('dateTime')
      .endAt(cutoffIso)
      .once('value');

    const departureUpdates = getAnonymizationUpdates(departuresSnap, cutoffIso);

    if (Object.keys(departureUpdates).length > 0) {
      await db.ref('/departures').update(departureUpdates);
      console.log(`Anonymized ${Object.keys(departureUpdates).filter(k => k.endsWith('/anonymized')).length} departures`);
    }

    const arrivalsSnap = await db.ref('/arrivals')
      .orderByChild('dateTime')
      .endAt(cutoffIso)
      .once('value');

    const arrivalUpdates = getAnonymizationUpdates(arrivalsSnap, cutoffIso);

    if (Object.keys(arrivalUpdates).length > 0) {
      await db.ref('/arrivals').update(arrivalUpdates);
      console.log(`Anonymized ${Object.keys(arrivalUpdates).filter(k => k.endsWith('/anonymized')).length} arrivals`);
    }

    if (Object.keys(departureUpdates).length === 0 && Object.keys(arrivalUpdates).length === 0) {
      console.log('No movements to anonymize');
    }
  });
