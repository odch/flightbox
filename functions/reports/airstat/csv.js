'use strict';

// CSV writer matching the client export: src/util/writeCsv.ts, which
// neutralizes every cell and then runs csv-stringify 6.9.0 with only the
// `delimiter` option. Parity is checked by src/util/airstatOracles/csv.spec.js.

const DELIMITERS = [',', ';'];

// Copy of src/util/neutralizeCsvValue.ts (formula-injection guard).
function neutralizeCsvValue(value) {
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

// csv-stringify 6.9.0 default casts for the values a database record can
// hold, plus Date, which csv-stringify writes as its timestamp. Anything
// else (bigint, function, symbol) throws instead of guessing.
function castCell(value) {
  if (value === undefined || value === null) {
    return '';
  }
  switch (typeof value) {
    case 'string':
      return value;
    case 'number':
      return String(value);
    case 'boolean':
      return value ? '1' : '';
    case 'object':
      if (value instanceof Date) {
        return String(value.getTime());
      }
      return JSON.stringify(value);
    default:
      throw new TypeError(`Unsupported CSV cell type: ${typeof value}`);
  }
}

// Quoted iff the text holds a quote, the delimiter, LF or CR.
function formatCell(value, delimiter) {
  const text = castCell(neutralizeCsvValue(value));
  if (/["\n\r]/.test(text) || text.includes(delimiter)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatRow(row, delimiter) {
  // The client rejects strings and treats objects as keyed records; neither
  // is a valid row here, so fail instead of emitting a silently wrong line.
  if (!Array.isArray(row)) {
    throw new TypeError('CSV row must be an array');
  }
  const cells = [];
  for (let i = 0; i < row.length; i++) {
    cells.push(formatCell(row[i], delimiter));
  }
  return cells.join(delimiter) + '\n';
}

// rows: array of arrays, header row included by the caller.
function toCsv(rows, delimiter = ',') {
  if (!DELIMITERS.includes(delimiter)) {
    throw new RangeError('CSV delimiter must be "," or ";"');
  }
  if (!Array.isArray(rows)) {
    throw new TypeError('CSV rows must be an array');
  }
  let csv = '';
  for (const row of rows) {
    csv += formatRow(row, delimiter);
  }
  // The client encodes each record to UTF-8, which turns lone surrogates into
  // U+FFFD. A delimiter or LF always separates cells, so one pass over the
  // whole text pairs nothing the client would not.
  return csv.toWellFormed();
}

module.exports = { toCsv };
