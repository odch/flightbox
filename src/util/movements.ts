import dates from '../util/dates';
import { filter } from '../util/filter';
import update from 'immutability-helper';
import moment from 'moment';

interface Movement {
  date: string;
  time: string;
  dateTime?: string;
  negativeTimestamp?: number;
  immatriculation: string;
  [key: string]: any;
}

function removeValues(movement: Movement, values: string[]): Movement {
  return filter(movement as any, (key) => {
    return values.indexOf(key) === -1;
  }) as unknown as Movement;
}

function convertLocalDateToUtc(movement: Movement): Movement {
  const withUtcDate = update(movement, {
    dateTime: { $set: dates.localToIsoUtc(movement.date, movement.time) },
  });
  return removeValues(withUtcDate, ['date', 'time']);
}

function convertUtcToLocalDate(movement: Movement): Movement {
  const localDate = dates.isoUtcToLocal(movement.dateTime!);
  const withLocalDate = update(movement, {
    date: { $set: localDate.date },
    time: { $set: localDate.time },
  });
  return removeValues(withLocalDate, ['dateTime']);
}

function removeNegativeTimestamp(movement: Movement): Movement {
  return removeValues(movement, ['negativeTimestamp']);
}

function addNegativeTimestamp(movement: Movement): Movement {
  const negativeTimestamp = dates.isoUtcToMilliseconds(movement.dateTime!) * -1;
  return update(movement, {
    negativeTimestamp: { $set: negativeTimestamp },
  });
}

export function firebaseToLocal(movement: Movement): Movement {
  const withLocalDate = convertUtcToLocalDate(movement);
  return removeNegativeTimestamp(withLocalDate);
}

export function localToFirebase(movement: Movement): Movement {
  const withUtc = convertLocalDateToUtc(movement);
  return addNegativeTimestamp(withUtc);
}

export function isLocked(movement: Movement, lockDate: number | unknown): boolean {
  if (typeof lockDate === 'number') {
    const movementDayTimestamp = dates.isoUtcToMilliseconds(dates.localToIsoUtc(movement.date, '00:00'));
    return movementDayTimestamp <= lockDate;
  }
  return false;
}

interface TransferProperty {
  name: string;
  defaultValue?: any;
}

export function transferValues(
  from: Record<string, any>,
  to: Record<string, any>,
  properties: (string | TransferProperty)[]
): void {
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
function compareDateDescending(a: Movement, b: Movement): number {
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
function compareDateAscending(a: Movement, b: Movement): number {
  return compareDateDescending(a, b) * -1;
}

/**
 * @param a the first movement
 * @param b the other movement
 * @returns {number} 1 if movement a takes place before movement b, otherwise -1.
 * If two movements take place at the same time, they are sorted lexicographically
 * by immatriculation (ascending).
 */
export function compareDescending(a: Movement, b: Movement): number {
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
export function compareAscending(a: Movement, b: Movement): number {
  const dateCompare = compareDateAscending(a, b);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return a.immatriculation.localeCompare(b.immatriculation);
}
