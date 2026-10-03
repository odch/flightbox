jest.mock('firebase-admin/database', () => ({
  getDatabase: jest.fn().mockReturnValue('db'),
}));
jest.mock('firebase-functions/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));
jest.mock('../reports/airstat', () => ({
  ...jest.requireActual('../reports/airstat'),
  generateAirstatReport: jest.fn(),
}));

const logger = require('firebase-functions/logger');
const {
  generateAirstatReport,
  AirstatRequestError,
  AirstatConfigError,
  AirstatDataError,
} = require('../reports/airstat');
const { AIRSTAT_PATHS, parseAirstatQuery, createAirstatHandler, registerReportRoutes } = require('./reports');

const CONFIG = { aerodrome: { ICAO: 'LSZE', runways: [] }, memberManagement: false };

describe('functions', () => {
  describe('api/reports', () => {
    describe('parseAirstatQuery', () => {
      it.each([
        [{ year: '2026', month: '9' }, { year: 2026, month: 9, internal: false, delimiter: ',' }],
        [{ year: '2026', month: '09', internal: 'true', delimiter: 'semicolon' },
          { year: 2026, month: 9, internal: true, delimiter: ';' }],
        [{ year: '2025', month: '12', internal: 'false', delimiter: ';' },
          { year: 2025, month: 12, internal: false, delimiter: ';' }],
        [{ year: '2026', month: '1', delimiter: 'comma' }, { year: 2026, month: 1, internal: false, delimiter: ',' }],
      ])('reads %j', (query, expected) => {
        expect(parseAirstatQuery(query)).toEqual(expected);
      });

      it.each([
        [{ month: '9' }, 'year'],
        [{ year: '26', month: '9' }, 'year'],
        [{ year: '2026' }, 'month'],
        [{ year: '2026', month: '13' }, 'month'],
        [{ year: '2026', month: '0' }, 'month'],
        [{ year: '2026', month: '9', internal: '1' }, 'internal'],
        [{ year: '2026', month: '9', delimiter: 'tab' }, 'delimiter'],
        [{ year: '2026', month: '9', delimiter: 'constructor' }, 'delimiter'],
        [{ year: '2026', month: '9', interal: 'true' }, 'interal'],
        [{ year: ['2026', '2025'], month: '9' }, 'year'],
      ])('rejects %j', (query, field) => {
        let error;
        try {
          parseAirstatQuery(query);
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(AirstatRequestError);
        expect(error.field).toBe(field);
      });
    });

    describe('handler', () => {
      let res;
      const req = query => ({ query, fbUserId: 'admin-uid' });

      beforeEach(() => {
        jest.clearAllMocks();
        res = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis(),
          setHeader: jest.fn(),
        };
      });

      it('sends the CSV as a file', async () => {
        generateAirstatReport.mockResolvedValue({
          csv: 'ARP\nLSZE\n', fileName: 'ARP_LSZE_092026_internal.csv', rowCount: 1, range: {},
        });

        await createAirstatHandler(CONFIG)(req({ year: '2026', month: '9', internal: 'true' }), res);

        expect(generateAirstatReport).toHaveBeenCalledWith('db', CONFIG,
          { year: 2026, month: 9, internal: true, delimiter: ',' });
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
        expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition',
          'attachment; filename="ARP_LSZE_092026_internal.csv"');
        expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith('ARP\nLSZE\n');
      });

      it('answers 400 for a bad query without generating anything', async () => {
        await createAirstatHandler(CONFIG)(req({ year: '2026' }), res);

        expect(generateAirstatReport).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_request', field: 'month' }));
      });

      it('answers 400 when the engine rejects the request', async () => {
        generateAirstatReport.mockRejectedValue(new AirstatRequestError('year', 'year must be from 2000 to 2099'));

        await createAirstatHandler(CONFIG)(req({ year: '1999', month: '9' }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ error: 'invalid_request', field: 'year' }));
      });

      it('lists the movements to correct on invalid data', async () => {
        const problems = [
          { code: 'unknown_flight_type', list: 'arrivals', key: '-Nb1', reference: 'NB1', value: 'bogus' },
        ];
        generateAirstatReport.mockRejectedValue(new AirstatDataError(problems));

        await createAirstatHandler(CONFIG)(req({ year: '2026', month: '9' }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          error: 'invalid_movement_data',
          problems: [{ code: 'unknown_flight_type', list: 'arrivals', reference: 'NB1', value: 'bogus' }],
        }));
        expect(logger.warn).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ problems }));
      });

      it.each([
        ['a config error', new AirstatConfigError('aerodrome.ICAO', 'bad config')],
        ['a database error', new Error('permission denied')],
      ])('answers 500 without details for %s', async (name, error) => {
        generateAirstatReport.mockRejectedValue(error);

        await createAirstatHandler(CONFIG)(req({ year: '2026', month: '9' }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: 'report_generation_failed' });
        expect(logger.error).toHaveBeenCalledWith(expect.any(String), error);
      });
    });

    describe('registerReportRoutes', () => {
      it('registers the report behind the given auth middleware', () => {
        const app = { get: jest.fn() };
        const auth = jest.fn();

        registerReportRoutes(app, CONFIG, auth);

        expect(app.get).toHaveBeenCalledWith(AIRSTAT_PATHS, auth, expect.any(Function));
        expect(AIRSTAT_PATHS).toEqual(['/v1/reports/airstat', '/api/v1/reports/airstat']);
      });
    });
  });
});
