'use strict';

const {
  generateAirstatReport,
  airstatFileName,
  AirstatRequestError,
  AirstatConfigError,
} = require('./index');
const { createFakeRtdb } = require('./testing/fakeRtdb');

const CONFIG = {
  project: 'lsze',
  aerodrome: { ICAO: 'LSZE', runways: [{ name: '12', type: 'A' }, { name: '30', type: 'A' }] },
  memberManagement: false,
};
const NOW = Date.UTC(2026, 9, 3, 8, 12);

const STORE = {
  departures: {
    '-Na1': { dateTime: '2026-09-02T06:30:00.000Z', immatriculation: 'HBKOF', aircraftCategory: 'Flugzeug',
      flightType: 'private', location: 'LSZH', runway: '30', departureRoute: 'W', lastname: '=Muster' },
  },
  arrivals: {
    '-Nb1': { dateTime: '2026-09-02T07:15:00.000Z', immatriculation: 'HBKOF', aircraftCategory: 'Flugzeug',
      flightType: 'instruction', location: 'LSZH', runway: '12', arrivalRoute: 'N', landingCount: 2,
      landingFeeTotal: 20 },
  },
  settings: { aircrafts: { club: { HBKOF: true } } },
  aerodromes: { LSZE: { name: 'Bad Ragaz' }, LSZH: { name: 'Zürich' } },
};

describe('functions', () => {
  describe('reports/airstat', () => {
    it('generates the CSV of a month', async () => {
      const result = await generateAirstatReport(createFakeRtdb(STORE), CONFIG,
        { year: 2026, month: 9, internal: true, delimiter: ';' }, { now: NOW });

      expect(result.csv.split('\n')).toEqual([
        'ARP;TYPMO;ACREG;TYPTR;NUMMO;ORIDE;PAX;DATMO;TIMMO;PIMO;TYPPI;DIRDE;CID;CDT;CDM;KEY;LASTNAME;EMAIL;MTOW;'
          + 'CLUB;HOME_BASE;ORIGINAL_ORIDE;REMARKS;FEES;LDG_COUNT;GA_COUNT;PAYMENT_METHOD;INVOICE_RECIPIENT',
        'LSZE;D;HBKOF;42;1;LSZH;0;20260902;0830;30;A;W;LSZE;20261003;1012;NA1;\'=Muster;;;1;;;;0;0;0;;',
        'LSZE;A;HBKOF;43;1;LSZH;0;20260902;0915;12;A;N;LSZE;20261003;1012;NB1;;;;1;;;;20;1;0;;',
        'LSZE;V;HBKOF;43;2;LSZE;0;20260902;0915;12;A;;LSZE;20261003;1012;NB1_CIRCUITS;;;;1;;;;0;1;0;;',
        '',
      ]);
      expect(result.fileName).toBe('ARP_LSZE_092026_internal.csv');
      expect(result.rowCount).toBe(3);
      expect(result.range).toEqual({ startAt: '2026-08-31T22:00:00.000Z', endAt: '2026-09-30T21:59:59.999Z' });
    });

    it('defaults to the comma, without internal columns and with the current time', async () => {
      const spy = jest.spyOn(Date, 'now').mockReturnValue(NOW);
      try {
        const result = await generateAirstatReport(createFakeRtdb(STORE), CONFIG, { year: 2026, month: 9 });
        expect(result.csv.split('\n')[1]).toBe('LSZE,D,HBKOF,42,1,LSZH,0,20260902,0830,30,A,W,LSZE,20261003,1012');
        expect(result.fileName).toBe('ARP_LSZE_092026.csv');
      } finally {
        spy.mockRestore();
      }
    });

    it.each([
      [null, 'request'],
      [{ year: 2026, month: 9, period: 'current' }, 'period'],
      [{ year: '2026', month: 9 }, 'year'],
      [{ year: 1999, month: 9 }, 'year'],
      [{ year: 2100, month: 1 }, 'year'],
      [{ year: 2026, month: 0 }, 'month'],
      [{ year: 2026, month: 13 }, 'month'],
      [{ year: 2026, month: 9.5 }, 'month'],
      [{ year: 2026, month: 9, internal: 'true' }, 'internal'],
      [{ year: 2026, month: 9, delimiter: '\t' }, 'delimiter'],
    ])('rejects the request %j before reading anything', async (request, field) => {
      const db = createFakeRtdb(STORE);
      const error = await generateAirstatReport(db, CONFIG, request).then(() => null, e => e);
      expect(error).toBeInstanceOf(AirstatRequestError);
      expect(error.field).toBe(field);
      expect(db.calls).toEqual([]);
    });

    it.each([
      [{ ...CONFIG, aerodrome: { ...CONFIG.aerodrome, ICAO: 'lsze' } }, 'aerodrome.ICAO'],
      [{ ...CONFIG, aerodrome: { ICAO: 'LSZE', runways: { 0: { name: '12', type: 'A' } } } }, 'aerodrome.runways'],
      [{ ...CONFIG, aerodrome: { ICAO: 'LSZE', runways: [null] } }, 'aerodrome.runways'],
      [{ ...CONFIG, aerodrome: { ICAO: 'LSZE', runways: [{ name: 12, type: 'A' }] } }, 'aerodrome.runways'],
      [{ ...CONFIG, aerodrome: { ICAO: 'LSZE', runways: [{ name: '12' }] } }, 'aerodrome.runways'],
      [{ ...CONFIG, memberManagement: 'yes' }, 'memberManagement'],
      [undefined, 'aerodrome.ICAO'],
    ])('rejects the config %j before reading anything', async (config, field) => {
      const db = createFakeRtdb(STORE);
      const error = await generateAirstatReport(db, config, { year: 2026, month: 9 }).then(() => null, e => e);
      expect(error).toBeInstanceOf(AirstatConfigError);
      expect(error.field).toBe(field);
      expect(db.calls).toEqual([]);
    });

    it('creates no Intl objects when required', () => {
      jest.isolateModules(() => {
        const dateTimeFormat = jest.spyOn(Intl, 'DateTimeFormat');
        const collator = jest.spyOn(Intl, 'Collator');
        try {
          require('./index');
          expect(dateTimeFormat).not.toHaveBeenCalled();
          expect(collator).not.toHaveBeenCalled();
        } finally {
          dateTimeFormat.mockRestore();
          collator.mockRestore();
        }
      });
    });

    it('names files like the client export', () => {
      expect(airstatFileName('LSZE', 2025, 12, false)).toBe('ARP_LSZE_122025.csv');
      expect(airstatFileName('LSPV', 2026, 1, true)).toBe('ARP_LSPV_012026_internal.csv');
    });
  });
});
