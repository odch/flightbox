import dates from '../core/dates.js';
import { filter } from '../core/filter.js';
import update from 'react-addons-update';

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

module.exports = {
  firebaseToLocal,
  localToFirebase,
};
