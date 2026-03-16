const functions = require('firebase-functions');
const admin = require('firebase-admin');

const AUDIT_FIELDS = ['createdBy', 'createdByName', 'createdAt', 'createdBy_orderKey', 'updatedBy', 'updatedByName', 'updatedAt'];

function stripAuditFields(obj) {
  if (!obj) return obj;
  const result = { ...obj };
  AUDIT_FIELDS.forEach(field => delete result[field]);
  return result;
}

function getCollectionPath(movementType) {
  return movementType === 'departure' ? 'departures' : 'arrivals';
}

async function getUserDetails(uid) {
  const userSnapshot = await admin.database()
    .ref('users')
    .child(uid)
    .once('value');

  if (!userSnapshot.exists()) {
    return null;
  }

  return userSnapshot.val();
}

async function handleCreate(snapshot, context, movementType) {
  if (context.authType !== 'USER') {
    return null;
  }

  const uid = context.auth.uid;
  const user = await getUserDetails(uid);
  const movement = snapshot.val();

  const auditData = {
    createdAt: admin.database.ServerValue.TIMESTAMP,
  };

  if (user) {
    auditData.createdBy = user.email || null;
    auditData.createdByName = [user.firstname, user.lastname].filter(Boolean).join(' ') || null;
    if (user.email && movement.negativeTimestamp) {
      auditData.createdBy_orderKey = user.email + '_' + String(Math.abs(movement.negativeTimestamp));
    }
  }

  return admin.database().ref(getCollectionPath(movementType)).child(snapshot.ref.key).update(auditData);
}

async function handleUpdate(change, context, movementType) {
  if (context.authType !== 'USER') {
    return null;
  }

  if (!change.before.exists() || !change.after.exists()) {
    return null;
  }

  const before = stripAuditFields(change.before.val());
  const after = stripAuditFields(change.after.val());

  if (JSON.stringify(before) === JSON.stringify(after)) {
    return null;
  }

  const uid = context.auth.uid;
  const user = await getUserDetails(uid);

  const auditData = {
    updatedAt: admin.database.ServerValue.TIMESTAMP,
  };

  if (user) {
    auditData.updatedBy = user.email || null;
    auditData.updatedByName = [user.firstname, user.lastname].filter(Boolean).join(' ') || null;
  }

  return admin.database().ref(getCollectionPath(movementType)).child(change.after.ref.key).update(auditData);
}

const instance = functions.config().rtdb.instance;

exports.auditDepartureOnCreate = functions.region('europe-west1').database
  .instance(instance)
  .ref('/departures/{departureId}')
  .onCreate((snapshot, context) => handleCreate(snapshot, context, 'departure'));

exports.auditArrivalOnCreate = functions.region('europe-west1').database
  .instance(instance)
  .ref('/arrivals/{arrivalId}')
  .onCreate((snapshot, context) => handleCreate(snapshot, context, 'arrival'));

exports.auditDepartureOnWrite = functions.region('europe-west1').database
  .instance(instance)
  .ref('/departures/{departureId}')
  .onWrite((change, context) => handleUpdate(change, context, 'departure'));

exports.auditArrivalOnWrite = functions.region('europe-west1').database
  .instance(instance)
  .ref('/arrivals/{arrivalId}')
  .onWrite((change, context) => handleUpdate(change, context, 'arrival'));
