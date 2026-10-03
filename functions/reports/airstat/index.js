'use strict';

// Server-side airstat (BAZL) report: the CSV the admin export builds in the
// browser (src/util/MovementReport.ts), for one Europe/Zurich month, with or
// without the internal columns. src/util/MovementReport.parity.spec.js checks
// that both produce the same bytes. Intended differences from the download:
// - CDT/CDM are in Zurich time (the client uses the browser's time zone).
// - Nothing is cut off at '#' (the browser download stops there).
// - A movement the client cannot render fails the whole report with an
//   AirstatDataError listing every such movement (the client export hangs),
//   and so does a dateTime outside the form the database rules allow.
// - Movements at the same minute are ordered by registration in de-CH, the
//   client uses the browser's locale (see movements.js).

const { MIN_YEAR, MAX_YEAR, monthRange, creationStamp } = require('./zurichTime');
const { DELIMITERS } = require('./csv');
const { loadAirstatInput } = require('./loadAirstatData');
const { deriveAirstatRows } = require('./deriveAirstatRows');
const { formatAirstatCsv } = require('./formatAirstatCsv');
const { AirstatRequestError, AirstatConfigError, AirstatDataError } = require('./errors');

const REQUEST_FIELDS = ['year', 'month', 'internal', 'delimiter'];
const ICAO = /^[A-Z0-9]{4}$/;

const isPlainObject = value =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function validateRequest(request) {
  if (!isPlainObject(request)) {
    throw new AirstatRequestError('request', 'Request must be an object');
  }
  const unknown = Object.keys(request).find(field => !REQUEST_FIELDS.includes(field));
  if (unknown !== undefined) {
    throw new AirstatRequestError(unknown, `Unknown request field: ${unknown}`);
  }
  const { year, month, internal, delimiter } = request;
  if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
    throw new AirstatRequestError('year', `year must be an integer from ${MIN_YEAR} to ${MAX_YEAR}`);
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new AirstatRequestError('month', 'month must be an integer from 1 to 12');
  }
  if (internal !== undefined && typeof internal !== 'boolean') {
    throw new AirstatRequestError('internal', 'internal must be a boolean');
  }
  if (delimiter !== undefined && !DELIMITERS.includes(delimiter)) {
    throw new AirstatRequestError('delimiter', 'delimiter must be "," or ";"');
  }
}

// The shape tasks/generateServerConfig.js produces; other fields are ignored.
function validateConfig(config) {
  const aerodrome = isPlainObject(config) ? config.aerodrome : undefined;
  if (!isPlainObject(aerodrome) || typeof aerodrome.ICAO !== 'string' || !ICAO.test(aerodrome.ICAO)) {
    throw new AirstatConfigError('aerodrome.ICAO', 'aerodrome.ICAO must be a 4-character ICAO code');
  }
  const { runways } = aerodrome;
  const isRunway = runway => isPlainObject(runway)
    && typeof runway.name === 'string' && runway.name !== '' && typeof runway.type === 'string';
  if (!Array.isArray(runways) || !runways.every(isRunway)) {
    throw new AirstatConfigError('aerodrome.runways', 'aerodrome.runways must be an array of {name, type}');
  }
  if (config.memberManagement !== undefined && typeof config.memberManagement !== 'boolean') {
    throw new AirstatConfigError('memberManagement', 'memberManagement must be a boolean');
  }
}

// MovementReport.getFileName, e.g. ARP_LSZE_092026_internal.csv.
function airstatFileName(icao, year, month, internal) {
  const mm = String(month).padStart(2, '0');
  return `ARP_${icao}_${mm}${year}${internal ? '_internal' : ''}.csv`;
}

/**
 * Generates the airstat CSV of one month.
 *
 * @param db      Admin SDK database (getDatabase())
 * @param config  {aerodrome: {ICAO, runways: [{name, type}]}, memberManagement}
 * @param request {year, month, internal?, delimiter?}
 * @param options {now?: number|Date} creation time for CDT/CDM, default now
 * @returns {Promise<{csv, fileName, rowCount, range: {startAt, endAt}}>}
 */
async function generateAirstatReport(db, config, request, options = {}) {
  validateConfig(config);
  validateRequest(request);

  const { year, month, delimiter } = request;
  const internal = request.internal === true;
  const range = monthRange(year, month);
  const creation = creationStamp(options.now === undefined ? Date.now() : options.now);

  const input = await loadAirstatInput(db, range);
  const records = deriveAirstatRows(input, { config, creation, internal });
  const csv = formatAirstatCsv(records, {
    internal,
    memberManagement: config.memberManagement === true,
    delimiter,
  });

  return {
    csv,
    fileName: airstatFileName(config.aerodrome.ICAO, year, month, internal),
    rowCount: records.length,
    range,
  };
}

module.exports = {
  generateAirstatReport,
  airstatFileName,
  AirstatRequestError,
  AirstatConfigError,
  AirstatDataError,
};
