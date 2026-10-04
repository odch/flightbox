// Oracle: the server-side Zurich time helpers must match the client code
// (dates.ts, MovementReport.ts, moment-timezone) exactly, and
// isStoredDateTime must stay within the RTDB dateTime rule.
// MovementReport (via flightTypes) reads __CONF__ at module load time, so
// global.__CONF__ is set before jest.resetModules() + require().

const {mulberry32} = require('../../../functions/reports/airstat/testing/mulberry32');
const rules = require('../../../firebase-rules-template.json');

const MAX_REPORTED = 10;

// Last Sunday of March/October at 01:00 UTC (EU rule, Switzerland since 1981).
const euTransitions = (fromYear, toYear) => {
  const result = [];
  for (let year = fromYear; year <= toYear; year++) {
    for (const month of [3, 10]) {
      const lastDay = new Date(Date.UTC(year, month, 0));
      const lastSunday = lastDay.getUTCDate() - lastDay.getUTCDay();
      result.push(Date.UTC(year, month - 1, lastSunday, 1));
    }
  }
  return result;
};

const collectMismatches = (inputs, actual, expected) => {
  const mismatches = [];
  for (const input of inputs) {
    const a = actual(input);
    const e = expected(input);
    if (JSON.stringify(a) !== JSON.stringify(e)) {
      mismatches.push({input, actual: a, expected: e});
      if (mismatches.length >= MAX_REPORTED) {
        break;
      }
    }
  }
  return mismatches;
};

describe('util', () => {
  describe('airstatOracles/zurichTime', () => {
    let engine;
    let dates;
    let MovementReport;
    let moment;
    let firebaseDatabase;

    beforeAll(() => {
      global.__CONF__ = {
        aerodrome: {
          ICAO: 'LSZT',
          runways: {
            0: {name: '10', type: 'A'},
            1: {name: '28', type: 'A'},
          },
        },
        enabledFlightTypes: {0: 'private', 1: 'instruction'},
        memberManagement: false,
      };

      jest.resetModules();
      jest.doMock('../firebase', () => ({__esModule: true, default: jest.fn()}));
      jest.doMock('../aircrafts', () => ({fetch: jest.fn()}));
      jest.doMock('../aerodromes', () => ({fetch: jest.fn()}));
      jest.doMock('firebase/database', () => ({
        get: jest.fn(() => Promise.resolve()),
        query: jest.fn(),
        orderByChild: jest.fn(),
        startAt: jest.fn(),
        endAt: jest.fn(),
      }));

      firebaseDatabase = require('firebase/database');
      dates = require('../dates').default;
      MovementReport = require('../MovementReport').default;
      moment = require('moment-timezone');
      engine = require('../../../functions/reports/airstat/zurichTime');
    });

    afterAll(() => {
      delete global.__CONF__;
    });

    it('uses the same 2000-2099 DST transitions as moment-timezone', () => {
      const zone = moment.tz.zone('Europe/Zurich');
      const fromZone = zone.untils.filter(t => t >= Date.UTC(2000, 0, 1) && t < Date.UTC(2100, 0, 1));
      expect(fromZone).toEqual(euTransitions(2000, 2099));
    });

    const months = [];
    for (let year = 2000; year <= 2099; year++) {
      for (let month = 1; month <= 12; month++) {
        months.push([year, month]);
      }
    }

    it('monthRange matches the MovementReport query bounds for every month 2000-2099', () => {
      const {startAt, endAt} = firebaseDatabase;
      const mismatches = collectMismatches(
        months,
        ([year, month]) => engine.monthRange(year, month),
        ([year, month]) => {
          startAt.mockClear();
          endAt.mockClear();
          new MovementReport(year, month).readMovements({key: 'D', path: '/departures'});
          return {startAt: startAt.mock.calls[0][0], endAt: endAt.mock.calls[0][0]};
        }
      );
      expect(mismatches).toEqual([]);
    });

    describe('isoUtcToLocal', () => {
      const compare = instants => collectMismatches(
        instants.map(ms => new Date(ms).toISOString()),
        iso => engine.isoUtcToLocal(iso),
        iso => dates.isoUtcToLocal(iso)
      );

      it('matches dates.isoUtcToLocal on 20000 instants 2000-2099 (seed 0x2ec4a1)', () => {
        const random = mulberry32(0x2ec4a1);
        const from = Date.UTC(2000, 0, 1);
        const span = Date.UTC(2100, 0, 1) - from;
        const instants = [];
        for (let i = 0; i < 20000; i++) {
          instants.push(from + Math.floor(random() * span));
        }
        expect(compare(instants)).toEqual([]);
      });

      it('matches every minute within 3 h of each DST transition 2020-2040', () => {
        const instants = [];
        for (const transition of euTransitions(2020, 2040)) {
          for (let minute = -180; minute <= 180; minute++) {
            instants.push(transition + minute * 60000);
          }
        }
        expect(instants).toHaveLength(42 * 361);
        expect(compare(instants)).toEqual([]);
      });

      it('matches 1 ms and 1 s around each DST transition 2000-2099', () => {
        const instants = [];
        for (const transition of euTransitions(2000, 2099)) {
          for (const delta of [-1000, -1, 0, 1, 999, 1000]) {
            instants.push(transition + delta);
          }
        }
        expect(compare(instants)).toEqual([]);
      });

      it('matches at each month bound 2000-2099', () => {
        const instants = [];
        for (const [year, month] of months) {
          const {startAt, endAt} = engine.monthRange(year, month);
          instants.push(Date.parse(startAt), Date.parse(endAt));
        }
        expect(compare(instants)).toEqual([]);
      });
    });

    // The engine accepts only the RTDB rule form, and of that only values
    // the client reads as the same instant. The one rule-form value the
    // client renders but the engine rejects is 'T24:00:00.000Z' (next day).
    describe('isStoredDateTime', () => {
      const digits = (random, from, to, width) =>
        String(from + Math.floor(random() * (to - from + 1))).padStart(width, '0');
      const ruleShaped = random => `${digits(random, 1999, 2100, 4)}-${digits(random, 0, 13, 2)}`
        + `-${digits(random, 0, 32, 2)}T${digits(random, 0, 24, 2)}:${digits(random, 0, 60, 2)}`
        + `:${digits(random, 0, 60, 2)}.${digits(random, 0, 999, 3)}Z`;
      const VARIANTS = [
        value => value.replace(/\.\d{3}Z$/, 'Z'),
        value => value.replace(/Z$/, '+00:00'),
        value => value.replace(/Z$/, '0Z'),
        value => value.replace('T', ' '),
        value => value.toLowerCase(),
        value => `+0${value}`,
        value => `${value}\n`,
        value => ` ${value}`,
      ];
      const EDGES = [
        '2000-02-29T12:00:00.000Z',
        '2024-02-29T12:00:00.000Z',
        '2025-02-29T12:00:00.000Z',
        '2100-02-29T12:00:00.000Z',
        '2026-04-31T12:00:00.000Z',
        '2026-12-31T23:59:59.999Z',
        '2026-12-31T24:00:00.000Z',
        '2026-03-29T24:00:00.000Z',
        '2026-10-25T24:00:00.000Z',
        '2026-01-01T24:00:00.001Z',
        '2026-01-01T23:60:00.000Z',
        '2026-01-01T23:59:60.000Z',
      ];

      const ruleRegExp = () => {
        const departures = rules.rules.departures.$departure_id.dateTime['.validate'];
        expect(rules.rules.arrivals.$arrival_id.dateTime['.validate']).toBe(departures);
        return new RegExp(/\.matches\(\/(.+)\/\)$/.exec(departures)[1]);
      };

      it('uses the dateTime pattern of the departures and arrivals rules', () => {
        expect(engine.STORED_DATE_TIME.source).toBe(ruleRegExp().source);
      });

      it('accepts only values the departures and arrivals rules accept (seed 0x5d7e)', () => {
        const rule = ruleRegExp();

        const random = mulberry32(0x5d7e);
        const values = [...EDGES];
        for (let i = 0; i < 2000; i++) {
          const value = ruleShaped(random);
          values.push(value, VARIANTS[Math.floor(random() * VARIANTS.length)](value));
        }
        const accepted = values.filter(value => engine.isStoredDateTime(value));
        expect(accepted.length).toBeGreaterThan(1000);
        expect(accepted.filter(value => !rule.test(value))).toEqual([]);
      });

      it('agrees with the client parser on 3000 rule-form values (seed 0x2b1d)', () => {
        const random = mulberry32(0x2b1d);
        const values = [...EDGES];
        for (let i = 0; i < 3000; i++) {
          values.push(ruleShaped(random));
        }
        const accepted = values.filter(value => engine.isStoredDateTime(value));
        expect(accepted.length).toBeGreaterThan(1000);
        expect(values.length - accepted.length).toBeGreaterThan(500);

        const mismatches = collectMismatches(
          values,
          value => engine.isStoredDateTime(value)
            && {instant: value, ...engine.isoUtcToLocal(value)},
          value => {
            const parsed = moment(value);
            return parsed.isValid() && !/T24:00:00\.000Z$/.test(value)
              && {instant: parsed.toISOString(), ...dates.isoUtcToLocal(value)};
          }
        );
        expect(mismatches).toEqual([]);
      });
    });

    describe('creationStamp', () => {
      const expected = ms => {
        const zurich = moment.tz(ms, 'Europe/Zurich');
        return {CDT: zurich.format('YYYYMMDD'), CDM: zurich.format('HHmm')};
      };

      it('matches moment-timezone on 5000 instants 2000-2099 (seed 0x7a11e)', () => {
        const random = mulberry32(0x7a11e);
        const from = Date.UTC(2000, 0, 1);
        const span = Date.UTC(2100, 0, 1) - from;
        const instants = [];
        for (let i = 0; i < 5000; i++) {
          instants.push(from + Math.floor(random() * span));
        }
        expect(collectMismatches(
          instants,
          ms => [engine.creationStamp(ms), engine.creationStamp(new Date(ms))],
          ms => {
            const stamp = expected(ms);
            return [stamp, stamp];
          }
        )).toEqual([]);
      });

      it('matches moment-timezone around each DST transition and midnight 2000-2099', () => {
        const instants = [];
        for (const transition of euTransitions(2000, 2099)) {
          for (const delta of [-60001, -1, 0, 1, 59999, 3600000]) {
            instants.push(transition + delta);
          }
        }
        for (let year = 2000; year <= 2099; year++) {
          const midnight = Date.UTC(year, 0, 1) - 3600000;
          instants.push(midnight - 1, midnight, midnight + 1);
        }
        expect(collectMismatches(instants, ms => engine.creationStamp(ms), expected)).toEqual([]);
      });
    });
  });
});
