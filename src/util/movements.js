import dates from '../util/dates';
import { filter } from '../util/filter';
import update from 'immutability-helper';
import moment from 'moment';

function removeValues(movement, values) {
  return filter(movement, (key) => {
    return values.indexOf(key) === -1;
  });
}

function convertLocalDateToUtc(movement) {
  const withUtcDate = update(movement, {
    dateTime: { $set: dates.localToIsoUtc(movement.date, movement.time) },
  });
  return removeValues(withUtcDate, ['date', 'time']);
}

function convertUtcToLocalDate(movement) {
  const localDate = dates.isoUtcToLocal(movement.dateTime);
  const withLocalDate = update(movement, {
    date: { $set: localDate.date },
    time: { $set: localDate.time },
  });
  return removeValues(withLocalDate, ['dateTime']);
}

function removeNegativeTimestamp(movement) {
  return removeValues(movement, ['negativeTimestamp']);
}

function addNegativeTimestamp(movement) {
  const negativeTimestamp = dates.isoUtcToMilliseconds(movement.dateTime) * -1;
  return update(movement, {
    negativeTimestamp: { $set: negativeTimestamp },
  });
}

export function firebaseToLocal(movement) {
  const withLocalDate = convertUtcToLocalDate(movement);
  return removeNegativeTimestamp(withLocalDate);
}

export function localToFirebase(movement) {
  const withUtc = convertLocalDateToUtc(movement);
  return addNegativeTimestamp(withUtc);
}

export function isLocked(movement, lockDate) {
  if (typeof lockDate === 'number') {
    const movementDayTimestamp = dates.isoUtcToMilliseconds(dates.localToIsoUtc(movement.date, '00:00'));
    return movementDayTimestamp <= lockDate;
  }
  return false;
}

export function transferValues(from, to, properties) {
  properties.forEach(prop => {
    if (typeof prop === 'string') {
      prop = {
        name: prop,
      };
    }

    const value = from[prop.name];
    if (value !== undefined && value !== null) {
      to[prop.name] = value;
    } else if (prop.defaultValue !== undefined && prop.defaultValue !== null) {
      to[prop.name] = prop.defaultValue;
    }
  });
}

/**
 * @param a the first movement
 * @param b the other movement
 * @returns {number} 1 if movement a takes place before movement b, if after -1, otherwise 0.
 */
function compareDateDescending(a, b) {
  const momentA = moment(dates.localToIsoUtc(a.date, a.time));
  const momentB = moment(dates.localToIsoUtc(b.date, b.time));

  if (momentA.isBefore(momentB)) {
    return 1;
  }
  if (momentA.isAfter(momentB)) {
    return -1;
  }

  return 0;
}

/**
 * Reverse of #compareDateAscending(a, b).
 */
function compareDateAscending(a, b) {
  return compareDateDescending(a, b) * -1;
}

/**
 * @param a the first movement
 * @param b the other movement
 * @returns {number} 1 if movement a takes place before movement b, otherwise -1.
 * If two movements take place at the same time, they are sorted lexicographically
 * by immatriculation (ascending).
 */
export function compareDescending(a, b) {
  const dateCompare = compareDateDescending(a, b);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return a.immatriculation.localeCompare(b.immatriculation);
}

/**
 * Reverse of #compareDescending(a, a).
 *
 * Still ordered by immatriculation ascending if movements take place at the same time.
 */
export function compareAscending(a, b) {
  const dateCompare = compareDateAscending(a, b);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return a.immatriculation.localeCompare(b.immatriculation);
}
