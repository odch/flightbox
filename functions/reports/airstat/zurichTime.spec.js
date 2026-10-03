'use strict';

const {
  monthRange,
  isoUtcToLocal,
  creationStamp,
  isStoredDateTime,
} = require('./zurichTime');

describe('functions', () => {
  describe('reports/airstat/zurichTime', () => {
    describe('monthRange', () => {
      it.each([
        [2026, 1, '2025-12-31T23:00:00.000Z', '2026-01-31T22:59:59.999Z'],
        [2026, 3, '2026-02-28T23:00:00.000Z', '2026-03-31T21:59:59.999Z'],
        [2026, 10, '2026-09-30T22:00:00.000Z', '2026-10-31T22:59:59.999Z'],
        [2025, 12, '2025-11-30T23:00:00.000Z', '2025-12-31T22:59:59.999Z'],
        [2024, 2, '2024-01-31T23:00:00.000Z', '2024-02-29T22:59:59.999Z'],
        [2023, 2, '2023-01-31T23:00:00.000Z', '2023-02-28T22:59:59.999Z'],
        [2026, 7, '2026-06-30T22:00:00.000Z', '2026-07-31T21:59:59.999Z'],
        [2000, 1, '1999-12-31T23:00:00.000Z', '2000-01-31T22:59:59.999Z'],
        [2099, 12, '2099-11-30T23:00:00.000Z', '2099-12-31T22:59:59.999Z'],
      ])('returns the client bounds for %i-%i', (year, month, startAt, endAt) => {
        expect(monthRange(year, month)).toEqual({ startAt, endAt });
      });

      it.each([
        [2026, 0],
        [2026, 13],
        [2026, 1.5],
        [2026, '10'],
        [2026, NaN],
        [2026, undefined],
        ['2026', 10],
        [2026.5, 10],
        [1999, 12],
        [2100, 1],
        [Infinity, 1],
        [null, 1],
        [Symbol('year'), 1],
      ])('throws a RangeError for (%p, %p)', (year, month) => {
        expect(() => monthRange(year, month)).toThrow(RangeError);
      });
    });

    describe('isoUtcToLocal', () => {
      it.each([
        // spring forward 2026-03-29 01:00Z (02:00 local becomes 03:00)
        ['2026-03-29T00:59:59.999Z', '2026-03-29', '01:59'],
        ['2026-03-29T01:00:00.000Z', '2026-03-29', '03:00'],
        // fall back 2026-10-25 01:00Z (03:00 local becomes 02:00)
        ['2026-10-25T00:30:00.000Z', '2026-10-25', '02:30'],
        ['2026-10-25T00:59:59.999Z', '2026-10-25', '02:59'],
        ['2026-10-25T01:00:00.000Z', '2026-10-25', '02:00'],
        ['2026-10-25T01:30:00.000Z', '2026-10-25', '02:30'],
        ['2026-10-25T02:00:00.000Z', '2026-10-25', '03:00'],
        // midnight and the turn of the year
        ['2025-12-31T22:59:59.999Z', '2025-12-31', '23:59'],
        ['2025-12-31T23:00:00.000Z', '2026-01-01', '00:00'],
        ['2026-06-30T22:00:00.000Z', '2026-07-01', '00:00'],
        ['2024-02-29T12:34:56.789Z', '2024-02-29', '13:34'],
      ])('converts %s', (iso, date, time) => {
        expect(isoUtcToLocal(iso)).toEqual({ date, time });
      });

      // Only the stored form is converted. Date.parse accepts most of these,
      // but the client reads them differently (date-only as browser
      // midnight, 02-30 as invalid, T24 as the next day).
      it.each([
        ['not a date'],
        ['2026-10-03'],
        ['2026-10-03T10:00'],
        ['2026-10-03T10:00:00Z'],
        ['2026-10-03T10:00:00.000+02:00'],
        ['2026-02-30T10:00:00.000Z'],
        ['2026-01-01T24:00:00.000Z'],
        ['2026'],
        [2026],
        [Date.parse('2026-10-03T08:12:00.000Z')],
        [new Date('2026-10-03T08:12:00.000Z')],
        [undefined],
      ])('throws a RangeError for %p', (value) => {
        expect(() => isoUtcToLocal(value)).toThrow(RangeError);
      });
    });

    describe('creationStamp', () => {
      it.each([
        ['2026-10-03T08:12:00.000Z', '20261003', '1012'],
        ['2026-12-31T23:30:00.000Z', '20270101', '0030'],
        ['2026-01-15T22:59:59.999Z', '20260115', '2359'],
        ['2026-03-29T01:00:00.000Z', '20260329', '0300'],
      ])('stamps %s in Zurich time', (iso, CDT, CDM) => {
        const ms = Date.parse(iso);
        expect(creationStamp(ms)).toEqual({ CDT, CDM });
        expect(creationStamp(new Date(ms))).toEqual({ CDT, CDM });
      });

      it('returns an 8 character CDT and a 4 character CDM', () => {
        const { CDT, CDM } = creationStamp(Date.parse('2026-01-01T00:00:00.000Z'));
        expect(CDT).toHaveLength(8);
        expect(CDM).toHaveLength(4);
      });

      it.each([
        [NaN],
        [Infinity],
        ['2026-10-03'],
        [undefined],
        [new Date('invalid')],
      ])('throws a RangeError for %p', (now) => {
        expect(() => creationStamp(now)).toThrow(RangeError);
      });
    });

    describe('isStoredDateTime', () => {
      it.each([
        '2026-10-03T08:12:00.000Z',
        '2024-02-29T23:59:59.999Z',
        '2026-12-31T00:00:00.000Z',
        '0000-01-01T00:00:00.000Z',
      ])('accepts %s', (value) => {
        expect(isStoredDateTime(value)).toBe(true);
      });

      it.each([
        ['2026-02-30T10:00:00.000Z'],
        ['2026-06-31T10:00:00.000Z'],
        ['2025-02-29T10:00:00.000Z'],
        ['2026-13-01T10:00:00.000Z'],
        ['2026-00-01T10:00:00.000Z'],
        ['2026-01-00T10:00:00.000Z'],
        ['2026-01-01T24:00:00.000Z'],
        ['2026-01-01T10:60:00.000Z'],
        ['2026-01-01T10:00:60.000Z'],
        ['2026-01-01'],
        ['2026-01-01T10:00:00.000'],
        ['2026-01-01T10:00:00Z'],
        ['2026-01-01T10:00Z'],
        ['2026-01-01T10:00:00.5Z'],
        ['2026-01-01T10:00:00.1234Z'],
        ['2026-01-01T10:00:00.000+02:00'],
        ['2026-01-01T10:00:00.000+0200'],
        ['2026-01-01 10:00:00.000Z'],
        ['2026-01-01t10:00:00.000z'],
        [' 2026-01-01T10:00:00.000Z'],
        ['2026-01-01T10:00:00.000Z\n'],
        ['+002026-01-01T10:00:00.000Z'],
        ['+010000-01-01T00:00:00.000Z'],
        ['-000001-01-01T00:00:00.000Z'],
        [''],
        [1767261600000],
        [new Date('2026-01-01T10:00:00.000Z')],
        [null],
        [undefined],
      ])('rejects %p', (value) => {
        expect(isStoredDateTime(value)).toBe(false);
      });
    });

    it('creates no Intl objects when required, then one formatter', () => {
      jest.isolateModules(() => {
        const spy = jest.spyOn(Intl, 'DateTimeFormat');
        try {
          const fresh = require('./zurichTime');
          expect(spy).not.toHaveBeenCalled();
          fresh.isoUtcToLocal('2026-10-03T08:12:00.000Z');
          fresh.creationStamp(0);
          fresh.monthRange(2026, 10);
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith('en-US', {
            timeZone: 'Europe/Zurich',
            hourCycle: 'h23',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
        } finally {
          spy.mockRestore();
        }
      });
    });
  });
});
