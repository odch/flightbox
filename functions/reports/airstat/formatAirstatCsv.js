'use strict';

const { toCsv } = require('./csv');

// MovementReport.header and internalHeader. MEMBERNR is only part of the
// internal columns for tenants with memberManagement.
const BASE_COLUMNS = [
  'ARP', 'TYPMO', 'ACREG', 'TYPTR', 'NUMMO', 'ORIDE', 'PAX', 'DATMO',
  'TIMMO', 'PIMO', 'TYPPI', 'DIRDE', 'CID', 'CDT', 'CDM',
];

const INTERNAL_COLUMNS = [
  'KEY', 'LASTNAME', 'EMAIL', 'MTOW', 'CLUB', 'HOME_BASE', 'ORIGINAL_ORIDE',
  'REMARKS', 'FEES', 'LDG_COUNT', 'GA_COUNT', 'PAYMENT_METHOD',
  'INVOICE_RECIPIENT',
];

function airstatColumns({ internal, memberManagement }) {
  if (!internal) {
    return BASE_COLUMNS;
  }
  const [key, ...rest] = INTERNAL_COLUMNS;
  return [...BASE_COLUMNS, key, ...(memberManagement ? ['MEMBERNR'] : []), ...rest];
}

// Header row first, then one row per record; empty months give the header
// only. delimiter ',' (default) or ';'.
function formatAirstatCsv(records, { internal, memberManagement, delimiter }) {
  const columns = airstatColumns({ internal, memberManagement });
  const rows = records.map(record => columns.map(column => record[column]));
  return toCsv([columns, ...rows], delimiter);
}

module.exports = { airstatColumns, formatAirstatCsv };
