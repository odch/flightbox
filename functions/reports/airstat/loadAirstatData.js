'use strict';

// Reads what MovementReport reads, with an injected Admin SDK database:
// the movements of one month and the reference data for the record fields.
// DataSnapshot.forEach stops at a callback that returns a truthy value, so
// every callback here has a block body.

const MOVEMENT_LISTS = [
  { type: 'D', list: 'departures' },
  { type: 'A', list: 'arrivals' },
];

// Departures first, then arrivals, each in query order (by dateTime, then
// key). The val() of a query is a plain object in key order and would lose
// that order, so the children are read with forEach.
async function loadMovementRange(db, { startAt, endAt }) {
  const snapshots = await Promise.all(MOVEMENT_LISTS.map(({ list }) =>
    db.ref(`/${list}`).orderByChild('dateTime').startAt(startAt).endAt(endAt).once('value')
  ));

  const entries = [];
  snapshots.forEach((snapshot, index) => {
    const { type, list } = MOVEMENT_LISTS[index];
    snapshot.forEach(child => {
      entries.push({ type, list, key: child.key, value: child.val() });
    });
  });
  return entries;
}

// Plain objects like the client's maps (aircrafts.ts, aerodromes.ts), so
// lookups behave the same. Aerodromes keep only whether the value is truthy,
// which is all getLocation checks.
async function loadReferenceData(db) {
  const [club, homeBase, aerodromes] = await Promise.all([
    '/settings/aircrafts/club',
    '/settings/aircrafts/homeBase',
    '/aerodromes',
  ].map(path => db.ref(path).once('value')));

  const keys = snapshot => {
    const result = {};
    snapshot.forEach(child => {
      result[child.key] = true;
    });
    return result;
  };

  const known = {};
  aerodromes.forEach(child => {
    if (child.val()) {
      known[child.key] = true;
    }
  });

  return { club: keys(club), homeBase: keys(homeBase), aerodromes: known };
}

async function loadAirstatInput(db, range) {
  const [movements, reference] = await Promise.all([
    loadMovementRange(db, range),
    loadReferenceData(db),
  ]);
  return { movements, ...reference };
}

module.exports = {
  MOVEMENT_LISTS,
  loadMovementRange,
  loadReferenceData,
  loadAirstatInput,
};
