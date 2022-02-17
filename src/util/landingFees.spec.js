import {
  getLandingFee,
  updateLandingFees,
  AircraftOrigin,
  getAircraftOrigin,
  updateGoAroundFees,
  getLandingFeeText
} from './landingFees'

/**
 * Test landing fees defined as Jest global:
 *
 * instruction:
 * - 0 - 750 kg: 11
 * - 751 - x kg: 15
 *
 * default:
 * - 0 - 750 kg: 16
 * - 751 - 1499 kg: 20
 * - 1500 - x kg: 50
 */
describe('util', () => {
  describe('landingFees', () => {
    describe('getLandingFee ', () => {
      describe.each([
        [0, 'instruction', AircraftOrigin.CLUB, 11],
        [750, 'instruction', AircraftOrigin.CLUB,  11],
        [751, 'instruction', AircraftOrigin.CLUB,  15],
        [1499, 'instruction', AircraftOrigin.CLUB,  15],
        [1500, 'instruction', AircraftOrigin.CLUB,  15],
        [10000, 'instruction', AircraftOrigin.CLUB, 15],

        [0, 'instruction', AircraftOrigin.HOME_BASE, 16],
        [750, 'instruction', AircraftOrigin.HOME_BASE,  16],
        [751, 'instruction', AircraftOrigin.HOME_BASE,  20],
        [1499, 'instruction', AircraftOrigin.HOME_BASE,  20],
        [1500, 'instruction', AircraftOrigin.HOME_BASE,  50],
        [10000, 'instruction', AircraftOrigin.HOME_BASE, 50],

        [0, 'instruction', AircraftOrigin.OTHER, 16],
        [750, 'instruction', AircraftOrigin.OTHER,  16],
        [751, 'instruction', AircraftOrigin.OTHER,  20],
        [1499, 'instruction', AircraftOrigin.OTHER,  20],
        [1500, 'instruction', AircraftOrigin.OTHER,  50],
        [10000, 'instruction', AircraftOrigin.OTHER, 50],

        [0, 'private', AircraftOrigin.CLUB, 16],
        [750, 'private', AircraftOrigin.CLUB, 16],
        [751, 'private', AircraftOrigin.CLUB, 20],
        [1499, 'private', AircraftOrigin.CLUB, 20],
        [1500, 'private', AircraftOrigin.CLUB, 50],
        [10000, 'private', AircraftOrigin.CLUB, 50],

        [0, 'private', AircraftOrigin.HOME_BASE, 16],
        [750, 'private', AircraftOrigin.HOME_BASE, 16],
        [751, 'private', AircraftOrigin.HOME_BASE, 20],
        [1499, 'private', AircraftOrigin.HOME_BASE, 20],
        [1500, 'private', AircraftOrigin.HOME_BASE, 50],
        [10000, 'private', AircraftOrigin.HOME_BASE, 50],

        [0, 'private', AircraftOrigin.OTHER, 16],
        [750, 'private', AircraftOrigin.OTHER, 16],
        [751, 'private', AircraftOrigin.OTHER, 20],
        [1499, 'private', AircraftOrigin.OTHER, 20],
        [1500, 'private', AircraftOrigin.OTHER, 50],
        [10000, 'private', AircraftOrigin.OTHER, 50]
      ])(
        'getLandingFee(%i, %s, %s)',
        (mtow, flightType, aircraftOrigin, expected) => {
          test(`returns ${expected}`, () => {
            expect(getLandingFee(mtow, flightType, aircraftOrigin)).toBe(expected);
          });
        }
      );

      test('throws error if no range found', () => {
        expect(() => getLandingFee(-1, 'instruction', AircraftOrigin.CLUB))
          .toThrow(`No fees defined for MTOW -1 and flight type 'instruction'`);
      })
    })

    describe('updateLandingFees', () => {
      test('does nothing if mtow not defined', () => {
        const changeAction = jest.fn();

        updateLandingFees(changeAction, undefined, 'private', AircraftOrigin.HOME_BASE, 2);

        expect(changeAction.mock.calls.length).toBe(0);
      })

      test('does nothing if flight type not defined', () => {
        const changeAction = jest.fn();

        updateLandingFees(changeAction, 1000, undefined, AircraftOrigin.HOME_BASE, 2);

        expect(changeAction.mock.calls.length).toBe(0);
      })

      test('does nothing if aircraft origin not defined', () => {
        const changeAction = jest.fn();

        updateLandingFees(changeAction, 1000, 'private', undefined, 2);

        expect(changeAction.mock.calls.length).toBe(0);
      })

      test('updates single landing fee if single landing fee could be calculated', () => {
        const changeAction = jest.fn();

        updateLandingFees(changeAction, 1000, 'private', AircraftOrigin.HOME_BASE, undefined);

        expect(changeAction.mock.calls.length).toBe(1);

        expect(changeAction.mock.calls[0]).toEqual(['landingFeeSingle', 20])
      })

      test('also updates total landing fee if landing count set', () => {
        const changeAction = jest.fn();

        updateLandingFees(changeAction, 1000, 'private', AircraftOrigin.HOME_BASE, 2);

        expect(changeAction.mock.calls.length).toBe(2);

        expect(changeAction.mock.calls[0]).toEqual(['landingFeeSingle', 20])
        expect(changeAction.mock.calls[1]).toEqual(['landingFeeTotal', 40])
      })
    })

    describe('updateGoAroundFees', () => {
      test('does nothing if mtow not defined', () => {
        const changeAction = jest.fn();

        updateGoAroundFees(changeAction, undefined, 'private', AircraftOrigin.HOME_BASE, 2);

        expect(changeAction.mock.calls.length).toBe(0);
      })

      test('does nothing if flight type not defined', () => {
        const changeAction = jest.fn();

        updateGoAroundFees(changeAction, 1000, undefined, AircraftOrigin.HOME_BASE, 2);

        expect(changeAction.mock.calls.length).toBe(0);
      })

      test('does nothing if aircraft origin not defined', () => {
        const changeAction = jest.fn();

        updateGoAroundFees(changeAction, 1000, 'private', undefined, 2);

        expect(changeAction.mock.calls.length).toBe(0);
      })

      test('updates single go around fee if single go around fee could be calculated', () => {
        const changeAction = jest.fn();

        updateGoAroundFees(changeAction, 1000, 'private', AircraftOrigin.HOME_BASE, undefined);

        expect(changeAction.mock.calls.length).toBe(1);

        expect(changeAction.mock.calls[0]).toEqual(['goAroundFeeSingle', 20])
      })

      test('also updates total go around fee if go around count set', () => {
        const changeAction = jest.fn();

        updateGoAroundFees(changeAction, 1000, 'private', AircraftOrigin.HOME_BASE, 2);

        expect(changeAction.mock.calls.length).toBe(2);

        expect(changeAction.mock.calls[0]).toEqual(['goAroundFeeSingle', 20])
        expect(changeAction.mock.calls[1]).toEqual(['goAroundFeeTotal', 40])
      })
    })

    describe('getAircraftOrigin', () => {
      const aircraftSettings = {
        club: { 'HBKOF': true },
        homeBase: { 'HBWYC': true }
      }

      test('returns undefined if immatriculation is undefined', () => {
        expect(getAircraftOrigin(undefined, aircraftSettings)).toBe(undefined);
      })

      test('returns AircraftOrigin.CLUB if is club aircraft', () => {
        expect(getAircraftOrigin('HBKOF', aircraftSettings)).toBe(AircraftOrigin.CLUB);
      })

      test('returns AircraftOrigin.HOME_BASE if is home base aircraft', () => {
        expect(getAircraftOrigin('HBWYC', aircraftSettings)).toBe(AircraftOrigin.HOME_BASE);
      })

      test('returns AircraftOrigin.OTHER if is foreign aircraft', () => {
        expect(getAircraftOrigin('HBCIY', aircraftSettings)).toBe(AircraftOrigin.OTHER);
      })
    })

    describe('getLandingFeeText', () => {
      describe.each([
        [undefined, undefined, undefined, undefined, undefined, undefined, null],
        [1, 20, 20, undefined, undefined, undefined, 'CHF 20.00'],
        [1, 20, 20, 0, 15, 0, 'CHF 20.00'],
        [2, 20, 40, undefined, undefined, undefined, 'CHF 40.00 (2 Landung(en) à CHF 20.00)'],
        [2, 20, 40, 0, 15, 0, 'CHF 40.00 (2 Landung(en) à CHF 20.00)'],
        [1, 20, 20, 1, 15, 15, 'CHF 35.00 (1 Landung(en) à CHF 20.00 und 1 Durchstart(s) à CHF 15.00)'],
        [1, 20, 20, 2, 15, 30, 'CHF 50.00 (1 Landung(en) à CHF 20.00 und 2 Durchstart(s) à CHF 15.00)'],
        [2, 20, 40, 2, 15, 30, 'CHF 70.00 (2 Landung(en) à CHF 20.00 und 2 Durchstart(s) à CHF 15.00)']
      ])(
        'getLandingFeeText(%i, %i, %i, %i, %i, %i)',
        (landings, landingFeeSingle, landingFeeTotal, goArounds, goAroundFeeSingle, goAroundFeeTotal, expected) => {
          test(`returns ${expected}`, () => {
            expect(getLandingFeeText(landings, landingFeeSingle, landingFeeTotal, goArounds, goAroundFeeSingle, goAroundFeeTotal)).toBe(expected);
          });
        }
      );
    })
  })
})
