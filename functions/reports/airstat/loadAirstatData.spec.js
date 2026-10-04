'use strict';

const { loadMovementRange, loadReferenceData } = require('./loadAirstatData');
const { createFakeRtdb } = require('./testing/fakeRtdb');

const RANGE = { startAt: '2026-09-30T22:00:00.000Z', endAt: '2026-10-31T22:59:59.999Z' };

describe('functions', () => {
  describe('reports/airstat/loadAirstatData', () => {
    it('reads departures, then arrivals, each in query order', async () => {
      const db = createFakeRtdb({
        departures: {
          '-Nz': { dateTime: '2026-10-01T10:00:00.000Z' },
          '-Na': { dateTime: '2026-10-02T10:00:00.000Z' },
          '-Nq': { dateTime: '2026-11-01T10:00:00.000Z' },
        },
        arrivals: {
          '-Nb': { dateTime: '2026-10-05T10:00:00.000Z' },
          '-Ny': { dateTime: '2026-10-01T09:00:00.000Z' },
        },
      });

      const entries = await loadMovementRange(db, RANGE);

      expect(entries.map(({ type, list, key }) => [type, list, key])).toEqual([
        ['D', 'departures', '-Nz'],
        ['D', 'departures', '-Na'],
        ['A', 'arrivals', '-Ny'],
        ['A', 'arrivals', '-Nb'],
      ]);
      expect(entries[0].value).toEqual({ dateTime: '2026-10-01T10:00:00.000Z' });
      expect(db.calls).toEqual([
        { path: '/departures', orderByChild: 'dateTime', ...RANGE },
        { path: '/arrivals', orderByChild: 'dateTime', ...RANGE },
      ]);
    });

    it('reads the club and home base registrations and the known aerodromes', async () => {
      const db = createFakeRtdb({
        settings: { aircrafts: { club: { HBKOF: true, HBZCD: 'x' }, homeBase: { HBXAB: 1 } } },
        aerodromes: { LSZH: { name: 'Zürich' }, LSZR: 0, LSZB: false },
      });

      expect(await loadReferenceData(db)).toEqual({
        club: { HBKOF: true, HBZCD: true },
        homeBase: { HBXAB: true },
        aerodromes: { LSZH: true },
      });
    });

    it('returns empty maps when nothing is stored', async () => {
      const db = createFakeRtdb({});
      expect(await loadMovementRange(db, RANGE)).toEqual([]);
      expect(await loadReferenceData(db)).toEqual({ club: {}, homeBase: {}, aerodromes: {} });
    });
  });
});
