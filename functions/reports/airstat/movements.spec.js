'use strict';

const { toLocalMovement, splitCircuits, compareAscending } = require('./movements');

describe('functions', () => {
  describe('reports/airstat/movements', () => {
    describe('toLocalMovement', () => {
      it('replaces dateTime and negativeTimestamp by the local date and time', () => {
        const value = { dateTime: 'x', negativeTimestamp: -1, date: 'old', immatriculation: 'HBKOF' };
        expect(toLocalMovement(value, '-Na1', 'D', { date: '2026-10-03', time: '10:12' })).toEqual({
          date: '2026-10-03', time: '10:12', immatriculation: 'HBKOF', key: '-Na1', type: 'D',
        });
        expect(value.dateTime).toBe('x');
      });
    });

    describe('splitCircuits', () => {
      const arrival = fields => ({ key: '-Nb1', type: 'A', arrivalRoute: 'N', location: 'LSZH',
        landingFeeTotal: 20, goAroundFeeTotal: 5, ...fields });
      const counts = ({ key, landingCount, goAroundCount }) => ({ key, landingCount, goAroundCount });

      it.each([
        [{ landingCount: 3, goAroundCount: 0 }, [['-Nb1_circuits', 2, 0], ['-Nb1', 1, 0]]],
        // The client gives the go-around to the arrival and the landing to circuits.
        [{ landingCount: 1, goAroundCount: 1 }, [['-Nb1_circuits', 1, 0], ['-Nb1', 0, 1]]],
        [{ landingCount: 0, goAroundCount: 2 }, [['-Nb1_circuits', 0, 1], ['-Nb1', 0, 1]]],
        [{ landingCount: 2 }, [['-Nb1_circuits', 1, NaN], ['-Nb1', 1, 0]]],
      ])('splits %j into the circuits movement and the arrival', (fields, expected) => {
        const parts = splitCircuits(arrival(fields), 'LSZE');
        expect(parts.map(counts)).toEqual(expected.map(([key, landingCount, goAroundCount]) =>
          ({ key, landingCount, goAroundCount })));
        expect(parts[0]).toMatchObject({ arrivalRoute: 'circuits', location: 'LSZE',
          landingFeeTotal: 0, goAroundFeeTotal: 0 });
        expect(parts[1]).toMatchObject({ arrivalRoute: 'N', location: 'LSZH',
          landingFeeTotal: 20, goAroundFeeTotal: 5 });
      });

      it.each([
        ['one landing', arrival({ landingCount: 1, goAroundCount: 0 })],
        ['a circuits arrival', arrival({ arrivalRoute: 'circuits', landingCount: 3 })],
        ['a departure', { key: '-Na1', type: 'D', landingCount: 3, goAroundCount: 1 }],
      ])('keeps %s as is', (name, movement) => {
        expect(splitCircuits(movement, 'LSZE')).toEqual([movement]);
      });
    });

    describe('compareAscending', () => {
      const at = (date, time, immatriculation) => ({ date, time, immatriculation });

      it('orders by local date and time to the minute, then by registration', () => {
        expect(compareAscending(at('2026-10-03', '10:12', 'B'), at('2026-10-03', '10:13', 'A'))).toBe(-1);
        expect(compareAscending(at('2026-10-04', '00:00', 'A'), at('2026-10-03', '23:59', 'B'))).toBe(1);
        expect(compareAscending(at('2026-10-03', '10:12', 'A'), at('2026-10-03', '10:12', 'B'))).toBeLessThan(0);
        expect(compareAscending(at('2026-10-03', '10:12', 'A'), at('2026-10-03', '10:12', 'A'))).toBe(0);
        expect(compareAscending(at('2026-10-03', '10:12', undefined), at('2026-10-03', '10:12', ''))).toBe(0);
      });

      it('breaks ties in de-CH, whatever the runtime locale', () => {
        // da, for one, sorts 'AA' after 'Z'.
        expect(compareAscending(at('2026-10-03', '10:12', 'HBAAX'), at('2026-10-03', '10:12', 'HBZZZ')))
          .toBeLessThan(0);
      });

      it('compares a non-string registration as text instead of throwing like the client', () => {
        expect(compareAscending(at('2026-10-03', '10:12', 42), at('2026-10-03', '10:12', 'A'))).toBeLessThan(0);
      });
    });
  });
});
