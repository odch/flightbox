'use strict';

// Europe/Zurich wall-clock helpers built on Intl only (no tz dependency).
// Ports dates.isoUtcToLocal and the month bounds MovementReport queries
// (dates.isoStartOfDay(first day) .. dates.isoEndOfDay(last day)).
// Parity with the client is checked for 2000-2099 only: Intl leaves years
// before 1000 unpadded, and moment-timezone has no DST data after 2499.

const TIMEZONE = 'Europe/Zurich';
const MIN_YEAR = 2000;
const MAX_YEAR = 2099;
const STORED_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

let formatter;

// Created on first use so that requiring this module stays side-effect free.
// The year must be 'numeric' ('2-digit' breaks DATMO and the ranges) and
// hourCycle 'h23' (not hour12:false) keeps midnight at '00'.
const getFormatter = () => {
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
  return formatter;
};

const zurichParts = (ms) => {
  const parts = {};
  for (const { type, value } of getFormatter().formatToParts(new Date(ms))) {
    parts[type] = value;
  }
  return parts;
};

// Offset (ms) of the Zurich wall clock against UTC at instant `ms`.
const offsetAt = (ms) => {
  const p = zurichParts(ms);
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const floored = ms - (((ms % 1000) + 1000) % 1000);
  return wall - floored;
};

// UTC ms of Zurich midnight on year-month-day. Midnight never falls into a
// DST gap or overlap in Europe/Zurich, so one correction step is enough.
const zurichMidnightUtc = (year, month, day) => {
  const wallAsUtc = Date.UTC(year, month - 1, day);
  let utc = wallAsUtc - offsetAt(wallAsUtc);
  const corrected = offsetAt(utc);
  if (wallAsUtc - utc !== corrected) {
    utc = wallAsUtc - corrected;
  }
  return utc;
};

const toMillis = (now) => {
  const ms = now instanceof Date ? now.getTime() : now;
  if (typeof ms !== 'number' || !Number.isFinite(ms)) {
    throw new RangeError('Invalid time value');
  }
  return ms;
};

// The RTDB rule for departures/arrivals dateTime, plus a real calendar date.
// This also rejects 'T24:00:00.000Z', which the client reads as next day.
const isStoredDateTime = (value) => {
  if (typeof value !== 'string' || !STORED_DATE_TIME.test(value)) {
    return false;
  }
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value;
};

// Inclusive ISO bounds for orderByChild('dateTime').startAt/endAt.
const monthRange = (year, month) => {
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    throw new RangeError('Invalid year');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('Invalid month');
  }
  // Date.UTC rolls month 13 over into January of the next year.
  const next = zurichMidnightUtc(year, month + 1, 1);
  return {
    startAt: new Date(zurichMidnightUtc(year, month, 1)).toISOString(),
    endAt: new Date(next - 1).toISOString(),
  };
};

// Only stored values are converted: other strings that Date.parse accepts
// (date-only, no offset, 02-30) would silently differ from the client.
const isoUtcToLocal = (isoUtc) => {
  if (!isStoredDateTime(isoUtc)) {
    throw new RangeError('Invalid stored dateTime');
  }
  const p = zurichParts(Date.parse(isoUtc));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
  };
};

// CDT (YYYYMMDD) and CDM (HHmm) in Zurich wall time.
const creationStamp = (now) => {
  const p = zurichParts(toMillis(now));
  return { CDT: `${p.year}${p.month}${p.day}`, CDM: `${p.hour}${p.minute}` };
};

module.exports = {
  STORED_DATE_TIME,
  monthRange,
  isoUtcToLocal,
  creationStamp,
  isStoredDateTime,
};
