'use strict';

const { z } = require('zod');
const logger = require('firebase-functions/logger');
const fetchAerodromeStatus = require('../../api/fetchAerodromeStatus');

const NAME = 'get_aerodrome_status';

// The values the admin area offers (src/components/AerodromeStatusForm).
const STATUS_VALUES = ['open', 'restricted', 'closed'];

const outputSchema = z.object({
  aerodrome: z.string().describe('ICAO code of the aerodrome'),
  status: z.string().nullable()
    .describe(`One of ${STATUS_VALUES.join(', ')}; null when no status has been set`),
  message: z.string().nullable().describe('Message of the aerodrome staff, if any'),
  lastUpdate: z.iso.datetime().nullable().describe('When the status was last set (ISO 8601, UTC)'),
  lastUpdateBy: z.string().nullable().describe('Display name of who last set the status'),
});

const nonEmptyString = value => (typeof value === 'string' && value.trim() !== '' ? value : null);

// Only public fields. last_update_user (uid, e-mail, names) is never passed
// on; `by` is the uid itself when the admin had no display name, so that is
// dropped too.
function toOutput(icao, status) {
  if (!status || !status.status) {
    return { aerodrome: icao, status: null, message: null, lastUpdate: null, lastUpdateBy: null };
  }
  const user = status.last_update_user || {};
  const by = nonEmptyString(status.last_update_by);
  return {
    aerodrome: icao,
    status: nonEmptyString(status.status),
    message: nonEmptyString(status.message),
    lastUpdate: nonEmptyString(status.last_update_date),
    lastUpdateBy: by !== null && by === user.uid ? null : by,
  };
}

const withPeriod = text => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);

// "2026-11-19T07:00:00.000Z" -> "2026-11-19 07:00 UTC"
const formatUtc = iso => `${iso.slice(0, 16).replace('T', ' ')} UTC`;

function toText(output) {
  if (output.status === null) {
    return `No status has been set for ${output.aerodrome}.`;
  }
  const parts = [`${output.aerodrome} is ${output.status}.`];
  if (output.message !== null) {
    parts.push(`Message: ${withPeriod(output.message)}`);
  }
  if (output.lastUpdate !== null) {
    const by = output.lastUpdateBy !== null ? ` by ${output.lastUpdateBy}` : '';
    parts.push(`Last updated ${formatUtc(output.lastUpdate)}${by}.`);
  }
  return parts.join(' ');
}

// `getDb` returns the Realtime Database (getDatabase of firebase-admin).
// Never throws: a failure is logged and answered with a generic tool error,
// without internals.
async function getAerodromeStatus(getDb, config) {
  const icao = config.aerodrome.ICAO;
  try {
    const output = toOutput(icao, await fetchAerodromeStatus(getDb()));
    return {
      structuredContent: output,
      content: [{ type: 'text', text: toText(output) }],
    };
  } catch (e) {
    logger.error('MCP get_aerodrome_status failed', e);
    return {
      isError: true,
      content: [{ type: 'text', text: 'The aerodrome status is not available right now. Please try again later.' }],
    };
  }
}

const aerodromeStatusTool = {
  name: NAME,
  access: 'public',
  definition: config => ({
    title: 'Aerodrome status',
    description: `Current operating status of aerodrome ${config.aerodrome.ICAO} as set by the aerodrome `
      + `staff in Flightbox: ${STATUS_VALUES.join(', ')}, with their message (e.g. reasons or restrictions) `
      + 'and when and by whom it was last set. Not an official source: check NOTAM and AIP for flight planning.',
    outputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  }),
  handler: ({ config, deps }) => () => getAerodromeStatus(deps.db, config),
};

module.exports = {
  NAME,
  STATUS_VALUES,
  getAerodromeStatus,
  aerodromeStatusTool,
};
