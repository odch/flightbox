'use strict';

jest.mock('firebase-functions/logger', () => ({ error: jest.fn() }));

const logger = require('firebase-functions/logger');
const { getAerodromeStatus, aerodromeStatusTool, STATUS_VALUES } = require('./aerodromeStatus');

const CONFIG = { aerodrome: { ICAO: 'LSZT', runways: [] } };

// Fake Realtime Database answering the latest-status query of
// fetchAerodromeStatus with `statuses` (or failing with `error`).
function fakeDb(statuses, error) {
  const query = {
    orderByChild: () => query,
    limitToLast: () => query,
    once: async () => {
      if (error) {
        throw error;
      }
      return { val: () => statuses };
    },
  };
  return () => ({ ref: () => query });
}

const STORED = {
  status: 'open',
  timestamp: Date.UTC(2026, 10, 19, 7),
  by: 'Hans Meier',
  details: 'Piste 24 nass',
  uid: 'uid-1234',
  firstname: 'Hans',
  lastname: 'Meier',
  email: 'hans.meier@example.com',
};

describe('functions', () => {
  describe('mcp', () => {
    describe('tools/aerodromeStatus', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('returns the current status as structured content and text', async () => {
        const result = await getAerodromeStatus(fakeDb({ s1: STORED }), CONFIG);

        expect(result.isError).toBeUndefined();
        expect(result.structuredContent).toEqual({
          aerodrome: 'LSZT',
          status: 'open',
          message: 'Piste 24 nass',
          lastUpdate: '2026-11-19T07:00:00.000Z',
          lastUpdateBy: 'Hans Meier',
        });
        expect(result.content).toEqual([{
          type: 'text',
          text: 'LSZT is open. Message: Piste 24 nass. Last updated 2026-11-19 07:00 UTC by Hans Meier.',
        }]);
      });

      it('leaves out an empty message', async () => {
        const result = await getAerodromeStatus(fakeDb({ s1: { ...STORED, status: 'closed', details: '' } }), CONFIG);

        expect(result.structuredContent.message).toBeNull();
        expect(result.content[0].text).toBe('LSZT is closed. Last updated 2026-11-19 07:00 UTC by Hans Meier.');
      });

      it('says so when no status has been set', async () => {
        const result = await getAerodromeStatus(fakeDb(null), CONFIG);

        expect(result.structuredContent).toEqual({
          aerodrome: 'LSZT', status: null, message: null, lastUpdate: null, lastUpdateBy: null,
        });
        expect(result.content).toEqual([{ type: 'text', text: 'No status has been set for LSZT.' }]);
      });

      it('never returns the uid, e-mail or name fields of the user who set the status', async () => {
        const result = await getAerodromeStatus(fakeDb({ s1: STORED }), CONFIG);
        const serialized = JSON.stringify(result);

        expect(serialized).not.toContain('uid-1234');
        expect(serialized).not.toContain('hans.meier@example.com');
        expect(serialized).not.toContain('last_update_user');
        expect(Object.keys(result.structuredContent).sort())
          .toEqual(['aerodrome', 'lastUpdate', 'lastUpdateBy', 'message', 'status']);
      });

      it('drops lastUpdateBy when it is just the uid of an admin without a name', async () => {
        const result = await getAerodromeStatus(fakeDb({ s1: { ...STORED, by: 'uid-1234' } }), CONFIG);

        expect(result.structuredContent.lastUpdateBy).toBeNull();
        expect(JSON.stringify(result)).not.toContain('uid-1234');
        expect(result.content[0].text).toBe('LSZT is open. Message: Piste 24 nass. Last updated 2026-11-19 07:00 UTC.');
      });

      it('answers a database error with a generic tool error and logs it', async () => {
        const error = new Error('PERMISSION_DENIED at /status (project secret-db)');
        const result = await getAerodromeStatus(fakeDb(null, error), CONFIG);

        expect(result.isError).toBe(true);
        expect(result.structuredContent).toBeUndefined();
        expect(JSON.stringify(result)).not.toMatch(/PERMISSION_DENIED|secret-db|status\)/);
        expect(result.content).toEqual([{
          type: 'text',
          text: 'The aerodrome status is not available right now. Please try again later.',
        }]);
        expect(logger.error).toHaveBeenCalledWith('MCP get_aerodrome_status failed', error);
      });

      it('answers a failing database lookup with a generic tool error', async () => {
        const getDb = () => {
          throw new Error('The default Firebase app does not exist.');
        };
        const result = await getAerodromeStatus(getDb, CONFIG);

        expect(result.isError).toBe(true);
        expect(JSON.stringify(result)).not.toContain('Firebase app');
      });

      it('is a public, read-only tool described for the aerodrome', async () => {
        const definition = aerodromeStatusTool.definition(CONFIG);

        expect(aerodromeStatusTool.name).toBe('get_aerodrome_status');
        expect(aerodromeStatusTool.access).toBe('public');
        expect(definition.title).toBe('Aerodrome status');
        expect(definition.description).toContain('LSZT');
        STATUS_VALUES.forEach(value => expect(definition.description).toContain(value));
        expect(definition.annotations).toEqual({
          readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false,
        });
        expect(definition.inputSchema).toBeUndefined();

        const callback = aerodromeStatusTool.handler({ config: CONFIG, deps: { db: fakeDb({ s1: STORED }) } });
        expect((await callback()).structuredContent.status).toBe('open');
      });

      it('has an output schema that accepts both results', async () => {
        const { outputSchema } = aerodromeStatusTool.definition(CONFIG);
        const present = await getAerodromeStatus(fakeDb({ s1: STORED }), CONFIG);
        const absent = await getAerodromeStatus(fakeDb(null), CONFIG);

        expect(outputSchema.safeParse(present.structuredContent).success).toBe(true);
        expect(outputSchema.safeParse(absent.structuredContent).success).toBe(true);
        expect(outputSchema.safeParse({ ...absent.structuredContent, lastUpdate: 'yesterday' }).success).toBe(false);
      });
    });
  });
});
