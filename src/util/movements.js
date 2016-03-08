import dates from '../core/dates.js';
import { filter } from '../core/filter.js';
import update from 'react-addons-update';
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

function firebaseToLocal(movement) {
  const withLocalDate = convertUtcToLocalDate(movement);
  return removeNegativeTimestamp(withLocalDate);
}

function localToFirebase(movement) {
  const withUtc = convertLocalDateToUtc(movement);
  return addNegativeTimestamp(withUtc);
}

/**
 * @param a the first movement
 * @param b the other movement
 * @returns {number} 1 if movement a takes place before movement b, otherwise -1.
 * If two movements take place at the same time, they are sorted lexicographically
 * by immatriculation.
 */
function compare(a, b) {
  const momentA = moment(dates.localToIsoUtc(a.date, a.time));
  const momentB = moment(dates.localToIsoUtc(b.date, b.time));

  if (momentA.isBefore(momentB)) {
    return 1;
  }
  if (momentA.isAfter(momentB)) {
    return -1;
  }

  return a.immatriculation.localeCompare(b.immatriculation);
}

module.exports = {
  firebaseToLocal,
  localToFirebase,
  compare,
};
