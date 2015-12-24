import dates from '../core/dates.js';
import { filter } from '../core/filter.js';
import update from 'react-addons-update';

function convertLocalDateToUtc(movement) {
  const withUtcDate = update(movement, {
    dateTime: { $set: dates.localToIsoUtc(movement.date, movement.time) },
  });
  return filter(withUtcDate, (key) => {
    return key !== 'date' && key !== 'time';
  });
}

function convertUtcToLocalDate(movement) {
  const localDate = dates.isoUtcToLocal(movement.dateTime);
  const withLocalDate = update(movement, {
    date: { $set: localDate.date },
    time: { $set: localDate.time },
  });
  return filter(withLocalDate, (key) => {
    return key !== 'dateTime';
  });
}

function firebaseToLocal(movement) {
  return convertUtcToLocalDate(movement);
}

function localToFirebase(movement) {
  return convertLocalDateToUtc(movement);
}

module.exports = {
  firebaseToLocal,
  localToFirebase,
};

