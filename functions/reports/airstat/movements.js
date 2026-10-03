'use strict';

// Movement handling of the client report (src/util/movements.ts and
// MovementReport.getMovementsArray): local date and time, circuit split and
// row order.

const CIRCUITS = 'circuits';
const CIRCUITS_KEY_SUFFIX = '_circuits';
const REGISTRATION_LOCALE = 'de-CH';

let collator;

// Created on first use so that requiring the engine stays side-effect free.
const getCollator = () => {
  if (!collator) {
    collator = new Intl.Collator(REGISTRATION_LOCALE);
  }
  return collator;
};

// Like firebaseToLocal plus the key and type MovementReport sets: dateTime
// and negativeTimestamp are replaced by the given Zurich `local` date/time.
function toLocalMovement(value, key, type, local) {
  const movement = { ...value, date: local.date, time: local.time, key, type };
  delete movement.dateTime;
  delete movement.negativeTimestamp;
  return movement;
}

// An arrival with more than one landing or with go-arounds is split into the
// arrival itself (one landing, or one go-around) and a circuits movement with
// the rest; fees stay on the arrival. Returns the circuits movement first,
// the order the client inserts them in. The arithmetic is the client's, NaN
// included (a missing goAroundCount stays NaN on the circuits movement).
function splitCircuits(movement, icao) {
  if (movement.type !== 'A'
    || movement.arrivalRoute === CIRCUITS
    || !(movement.landingCount > 1 || movement.goAroundCount > 0)) {
    return [movement];
  }

  const arrival = { ...movement };
  const circuits = { ...movement };

  circuits.key += CIRCUITS_KEY_SUFFIX;
  circuits.arrivalRoute = CIRCUITS;
  circuits.location = icao;

  arrival.landingCount = arrival.landingCount > 1 ? 1 : 0;
  arrival.goAroundCount = arrival.landingCount === 1 ? 0 : 1;

  circuits.landingCount -= arrival.landingCount;
  circuits.goAroundCount -= arrival.goAroundCount;

  circuits.landingFeeTotal = 0;
  circuits.goAroundFeeTotal = 0;

  return [circuits, arrival];
}

// compareAscending of movements.ts: by local date and time to the minute,
// then by registration. The client compares the instants it gets back from
// localToIsoUtc(date, time); comparing the 'YYYY-MM-DD HH:mm' strings gives
// the same order for every time isoUtcToLocal can produce, including the
// repeated hour when DST ends (equal strings tie there as well). The client
// breaks ties with localeCompare in the browser's locale; the server uses
// de-CH so its output does not depend on the runtime's locale (en, de, fr
// and it agree; e.g. da sorts 'AA' after 'Z').
function compareAscending(a, b) {
  const left = `${a.date} ${a.time}`;
  const right = `${b.date} ${b.time}`;
  if (left !== right) {
    return left < right ? -1 : 1;
  }
  return getCollator().compare(a.immatriculation || '', b.immatriculation || '');
}

module.exports = {
  CIRCUITS,
  CIRCUITS_KEY_SUFFIX,
  REGISTRATION_LOCALE,
  toLocalMovement,
  splitCircuits,
  compareAscending,
};
