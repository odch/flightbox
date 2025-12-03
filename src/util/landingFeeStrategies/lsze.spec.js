import lsze from './lsze'

describe('util', () => {
  describe('landingFeeStrategies', () => {
    describe('lsze', () => {
      describe('getLandingFee ', () => {
        describe.each([
          [0, 'Flugzeug', 18.5],
          [0, 'Hubschrauber', 18.5],
          [1000, 'Flugzeug', 18.5],
          [1000, 'Hubschrauber', 18.5],
          [1001, 'Flugzeug', 27.75],
          [1001, 'Hubschrauber', 27.75],
          [2000, 'Flugzeug', 27.75],
          [2000, 'Hubschrauber', 27.75],
          [2001, 'Flugzeug', 37],
          [2001, 'Hubschrauber', 55.5],
          [3000, 'Flugzeug', 37],
          [3000, 'Hubschrauber', 55.5],
          [3001, 'Flugzeug', 37],
          [3001, 'Hubschrauber', 55.5],
        ])(
          'getLandingFee(%i, %s, %i)',
          (mtow, aircraftCategory, expected) => {
            test(`returns ${expected}`, () => {
              const landingFee = lsze.getLandingFee(mtow, undefined, undefined, aircraftCategory)
              if (expected === undefined) {
                expect(landingFee).toBe(undefined)
              } else {
                expect(landingFee.fee).toBe(expected);
              }
            });
          }
        )
      })

      describe('getVatRate ', () => {
        test('returns 8.1', () => {
          const vatRate = lsze.getVatRate(undefined, undefined, 'Flugzeug')
          expect(vatRate).toBe(8.1);
        })
      })
    })
  })
})
