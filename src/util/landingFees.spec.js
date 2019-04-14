import {getLandingFee, updateMovementFees} from './landingFees'

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
        [0, 'instruction', 11],
        [750, 'instruction', 11],
        [751, 'instruction', 15],
        [10000, 'instruction', 15],

        [0, 'private', 16],
        [750, 'private', 16],
        [751, 'private', 20],
        [1499, 'private', 20],
        [1500, 'private', 50],
        [10000, 'private', 50]
      ])(
        'getLandingFee(%i, %s)',
        (mtow, flightType, expected) => {
          test(`returns ${expected}`, () => {
            expect(getLandingFee(mtow, flightType)).toBe(expected);
          });
        }
      );

      test('throws error if no range found', () => {
        expect(() => getLandingFee(-1, 'instruction'))
          .toThrow(`No landing fees defined for MTOW -1 and flight type 'instruction'`)
      })
    })

    describe('updateMovementFees', () => {
      test('does nothing if mtow not defined', () => {
        const changeAction = jest.fn();

        updateMovementFees(changeAction, undefined, 'private', 2);

        expect(changeAction.mock.calls.length).toBe(0);
      })

      test('does nothing if flight type not defined', () => {
        const changeAction = jest.fn();

        updateMovementFees(changeAction, 1000, undefined, 2);

        expect(changeAction.mock.calls.length).toBe(0);
      })

      test('updates single landing fee if mtow and flight type set and single landing fee could be calculated', () => {
        const changeAction = jest.fn();

        updateMovementFees(changeAction, 1000, 'private', undefined);

        expect(changeAction.mock.calls.length).toBe(1);

        expect(changeAction.mock.calls[0]).toEqual(['landingFeeSingle', 20])
      })

      test('also updates total landing fee if landing count set', () => {
        const changeAction = jest.fn();

        updateMovementFees(changeAction, 1000, 'private', 2);

        expect(changeAction.mock.calls.length).toBe(2);

        expect(changeAction.mock.calls[0]).toEqual(['landingFeeSingle', 20])
        expect(changeAction.mock.calls[1]).toEqual(['landingFeeTotal', 40])
      })
    })
  })
})
