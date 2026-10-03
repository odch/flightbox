'use strict';

const { deriveAirstatRows } = require('./deriveAirstatRows');
const { AirstatDataError } = require('./errors');

const CONFIG = {
  aerodrome: { ICAO: 'LSZE', runways: [{ name: '12', type: 'A' }, { name: '30', type: 'G' }] },
  memberManagement: true,
};
const CREATION = { CDT: '20261003', CDM: '1012' };

const departure = (key, fields) => ({
  type: 'D', list: 'departures', key,
  value: { dateTime: '2026-10-02T08:00:00.000Z', immatriculation: 'HBKOF', aircraftCategory: 'Flugzeug',
    flightType: 'private', ...fields },
});
const arrival = (key, fields) => ({ ...departure(key, fields), type: 'A', list: 'arrivals' });

const derive = (movements, internal = true) => deriveAirstatRows(
  { movements, club: { HBKOF: true }, homeBase: {}, aerodromes: { LSZH: true } },
  { config: CONFIG, creation: CREATION, internal }
);

describe('functions', () => {
  describe('reports/airstat/deriveAirstatRows', () => {
    it('derives the base and internal fields of a departure', () => {
      const [record] = derive([departure('-Na1', {
        location: 'lszh', runway: '30', departureRoute: 'N', passengerCount: 2, mtow: 750,
        lastname: 'Muster', email: 'max@example.ch', memberNr: '42', remarks: 'ok',
      })]);
      expect(record).toEqual({
        ARP: 'LSZE', TYPMO: 'D', ACREG: 'HBKOF', TYPTR: 42, NUMMO: 1, ORIDE: 'LSZH', PAX: 2,
        DATMO: '20261002', TIMMO: '1000', PIMO: '30', TYPPI: 'G', DIRDE: 'N', CID: 'LSZE',
        CDT: '20261003', CDM: '1012',
        KEY: 'NA1', MEMBERNR: '42', LASTNAME: 'Muster', EMAIL: 'max@example.ch', MTOW: 750,
        CLUB: 1, HOME_BASE: undefined, ORIGINAL_ORIDE: undefined, REMARKS: 'ok', FEES: 0,
        LDG_COUNT: 0, GA_COUNT: 0, PAYMENT_METHOD: undefined, INVOICE_RECIPIENT: undefined,
      });
    });

    it('splits an arrival with circuits into two rows and keeps fees on the arrival', () => {
      const records = derive([arrival('-Nb1', {
        arrivalRoute: 'W', landingCount: 3, landingFeeTotal: 20, goAroundFeeTotal: 2.5, location: 'XXXX',
        paymentMethod: { method: 'invoice', invoiceRecipientName: 'MG Ragaz' },
      })]);
      expect(records.map(r => [r.KEY, r.TYPMO, r.NUMMO, r.DIRDE, r.ORIDE, r.ORIGINAL_ORIDE, r.FEES, r.LDG_COUNT]))
        .toEqual([
          ['NB1', 'A', 1, 'W', 'LSZZ', 'XXXX', 22.5, 1],
          ['NB1_CIRCUITS', 'V', 4, '', 'LSZZ', 'LSZE', 0, 2],
        ]);
      expect(records[1].INVOICE_RECIPIENT).toBe('MG Ragaz');
    });

    it('leaves out the internal fields unless asked for', () => {
      const [record] = derive([departure('-Na1')], false);
      expect(Object.keys(record)).toHaveLength(15);
    });

    it('adds MEMBERNR only with memberManagement', () => {
      const [record] = deriveAirstatRows(
        { movements: [departure('-Na1', { memberNr: '42' })], club: {}, homeBase: {}, aerodromes: {} },
        { config: { ...CONFIG, memberManagement: false }, creation: CREATION, internal: true }
      );
      expect(record).not.toHaveProperty('MEMBERNR');
      expect(record.KEY).toBe('NA1');
    });

    it('uses runway 0 for helicopters without a runway', () => {
      const records = derive([
        departure('-Na1', { aircraftCategory: 'Hubschrauber' }),
        departure('-Na2', { aircraftCategory: undefined, immatriculation: 'HBXAB', dateTime: '2026-10-02T09:00:00.000Z' }),
        departure('-Na3', { runway: '99', dateTime: '2026-10-02T10:00:00.000Z' }),
      ]);
      expect(records.map(r => [r.PIMO, r.TYPPI])).toEqual([['0', ''], ['0', ''], ['99', '']]);
    });

    it('drops departure circuits and skips a key that is already present', () => {
      const records = derive([
        departure('-Na1', { departureRoute: 'circuits', flightType: 'bogus' }),
        departure('-Na2'),
        arrival('-Na2', { dateTime: 'not a date' }),
      ]);
      expect(records.map(r => r.KEY)).toEqual(['NA2']);
    });

    it('reports every invalid movement at once', () => {
      let error;
      try {
        derive([
          departure('-Na1', { dateTime: '2026-10-02T08:00Z' }),
          arrival('-Nb2', { dateTime: '2026-10-02', arrivalRoute: 'N', landingCount: 3 }),
          arrival('-Nb1', { flightType: 'bogus', arrivalRoute: 'N', landingCount: 2 }),
          departure('-Na2', { flightType: 'other', dateTime: '2026-10-02T09:00:00.000Z' }),
        ]);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(AirstatDataError);
      expect(error.code).toBe('invalid_movement_data');
      expect(error.problems).toEqual([
        { code: 'invalid_date_time', list: 'departures', key: '-Na1', reference: 'NA1', value: '2026-10-02T08:00Z' },
        { code: 'invalid_date_time', list: 'arrivals', key: '-Nb2', reference: 'NB2', value: '2026-10-02' },
        { code: 'unknown_flight_type', list: 'arrivals', key: '-Nb1', reference: 'NB1', value: 'bogus' },
        { code: 'unknown_flight_type', list: 'departures', key: '-Na2', reference: 'NA2', value: 'other' },
      ]);
    });
  });
});
