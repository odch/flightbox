import lspl from './lspl'
import {AircraftOrigin} from '../landingFees'

describe('util', () => {
  describe('landingFeeStrategies', () => {
    describe('lspl', () => {
      describe('getLandingFee ', () => {
        describe.each([
          // homebase plane / motorglider / self-launching glider — flat 7
          [0, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],
          [1000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],
          [2000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],
          [50000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],
          [1000, 'private', AircraftOrigin.CLUB, 'Flugzeug', 7],
          [1000, 'private', AircraftOrigin.HOME_BASE, 'Motorsegler', 7],
          [1000, 'private', AircraftOrigin.HOME_BASE, 'Eigenbauflugzeug', 7],

          // homebase + instruction — also flat 7 (no special instruction rule)
          [1000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],
          [1000, 'instruction', AircraftOrigin.CLUB, 'Flugzeug', 7],
          [2000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],

          // homebase glider self-launch / winch — flat 7
          [0, 'glider_private_self', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 7],
          [0, 'glider_private_winch', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 7],
          [0, 'glider_instruction_self', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 7],
          [0, 'glider_instruction_winch', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 7],

          // homebase helicopter — flat 7 (extending homebase rule)
          [0, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 7],
          [2000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 7],
          [1000, 'instruction', AircraftOrigin.HOME_BASE, 'Eigenbauhubschrauber', 7],

          // non-homebase plane / motorglider / glider — MTOW scale (gross 20 / 25)
          [0, 'private', AircraftOrigin.OTHER, 'Flugzeug', 18.5],
          [500, 'private', AircraftOrigin.OTHER, 'Flugzeug', 18.5],
          [1000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 18.5],
          [1001, 'private', AircraftOrigin.OTHER, 'Flugzeug', 23.13],
          [2000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 23.13],
          [50000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 23.13],
          [50001, 'private', AircraftOrigin.OTHER, 'Flugzeug', undefined],
          [800, 'private', AircraftOrigin.OTHER, 'Motorsegler', 18.5],
          [1500, 'private', AircraftOrigin.OTHER, 'Motorsegler', 23.13],
          [0, 'glider_private_self', AircraftOrigin.OTHER, 'Segelflugzeug', 18.5],
          [0, 'glider_private_winch', AircraftOrigin.OTHER, 'Segelflugzeug', 18.5],

          // non-homebase external instruction — same MTOW scale (no special rule)
          [800, 'instruction', AircraftOrigin.OTHER, 'Flugzeug', 18.5],
          [2000, 'instruction', AircraftOrigin.OTHER, 'Flugzeug', 23.13],

          // non-homebase helicopter — uses MTOW scale like planes
          [800, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 18.5],
          [1500, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 23.13],
          [50000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 23.13],
          [50001, 'private', AircraftOrigin.OTHER, 'Hubschrauber', undefined],
          [1000, 'private', AircraftOrigin.OTHER, 'Eigenbauhubschrauber', 18.5],

          // aerotow tug — flat 8 regardless of MTOW or origin
          [800, 'aerotow', AircraftOrigin.HOME_BASE, 'Flugzeug', 8],
          [800, 'aerotow', AircraftOrigin.CLUB, 'Flugzeug', 8],
          [800, 'aerotow', AircraftOrigin.OTHER, 'Flugzeug', 8],
          [2000, 'aerotow', AircraftOrigin.OTHER, 'Flugzeug', 8],

          // aerotowed glider — no fee (covered by tug)
          [0, 'glider_private_aerotow', AircraftOrigin.HOME_BASE, 'Segelflugzeug', undefined],
          [0, 'glider_private_aerotow', AircraftOrigin.OTHER, 'Segelflugzeug', undefined],
          [0, 'glider_instruction_aerotow', AircraftOrigin.HOME_BASE, 'Segelflugzeug', undefined],
          [0, 'glider_instruction_aerotow', AircraftOrigin.OTHER, 'Segelflugzeug', undefined],

          // hot air balloon — flat 20 (gross) per movement, regardless of origin / flight type
          [0, 'private', AircraftOrigin.OTHER, 'Ballon (Heissluft)', 18.5],
          [0, 'private', AircraftOrigin.HOME_BASE, 'Ballon (Heissluft)', 18.5],
          [0, 'private', AircraftOrigin.OTHER, 'Ballon (Gas)', 18.5],
          [0, 'private', AircraftOrigin.OTHER, 'Luftschiff (Heissluft)', 18.5],
        ])(
          'getLandingFee(%i, %s, %s, %s)',
          (mtow, flightType, aircraftOrigin, aircraftCategory, expected) => {
            test(`returns ${expected}`, () => {
              const landingFee = lspl.getLandingFee(mtow, flightType, aircraftOrigin, aircraftCategory)
              if (expected === undefined) {
                expect(landingFee).toBe(undefined)
              } else {
                expect(landingFee!.fee).toBe(expected)
              }
            })
          }
        )
      })

      describe('getGoAroundFee', () => {
        it('always returns undefined', () => {
          expect(lspl.getGoAroundFee(0, 'private', AircraftOrigin.OTHER, 'Flugzeug')).toBeUndefined()
          expect(lspl.getGoAroundFee(1000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug')).toBeUndefined()
          expect(lspl.getGoAroundFee(800, 'aerotow', AircraftOrigin.HOME_BASE, 'Flugzeug')).toBeUndefined()
          expect(lspl.getGoAroundFee(0, 'glider_private_aerotow', AircraftOrigin.HOME_BASE, 'Segelflugzeug')).toBeUndefined()
          expect(lspl.getGoAroundFee(0, 'private', AircraftOrigin.OTHER, 'Ballon (Heissluft)')).toBeUndefined()
        })
      })

      describe('getVatRate ', () => {
        describe.each([
          // homebase → 0
          ['private', AircraftOrigin.HOME_BASE, 'Flugzeug', 0],
          ['private', AircraftOrigin.CLUB, 'Flugzeug', 0],
          ['instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 0],
          ['instruction', AircraftOrigin.CLUB, 'Flugzeug', 0],
          ['private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 0],
          ['private', AircraftOrigin.HOME_BASE, 'Motorsegler', 0],
          ['glider_private_self', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 0],
          ['glider_private_winch', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 0],

          // aerotow (any origin) → 0 (member tow service)
          ['aerotow', AircraftOrigin.HOME_BASE, 'Flugzeug', 0],
          ['aerotow', AircraftOrigin.OTHER, 'Flugzeug', 0],
          ['glider_private_aerotow', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 0],
          ['glider_instruction_aerotow', AircraftOrigin.OTHER, 'Segelflugzeug', 0],

          // non-homebase → 8.1
          ['private', AircraftOrigin.OTHER, 'Flugzeug', 8.1],
          ['instruction', AircraftOrigin.OTHER, 'Flugzeug', 8.1],
          ['private', AircraftOrigin.OTHER, 'Hubschrauber', 8.1],
          ['private', AircraftOrigin.OTHER, 'Motorsegler', 8.1],
          ['glider_private_self', AircraftOrigin.OTHER, 'Segelflugzeug', 8.1],
          ['glider_private_winch', AircraftOrigin.OTHER, 'Segelflugzeug', 8.1],

          // balloon → 8.1 regardless of origin
          ['private', AircraftOrigin.OTHER, 'Ballon (Heissluft)', 8.1],
          ['private', AircraftOrigin.HOME_BASE, 'Ballon (Heissluft)', 8.1],
          ['private', AircraftOrigin.OTHER, 'Ballon (Gas)', 8.1],
          ['private', AircraftOrigin.OTHER, 'Luftschiff (Heissluft)', 8.1],
        ])(
          'getVatRate(%s, %s, %s)',
          (flightType, aircraftOrigin, aircraftCategory, expected) => {
            test(`returns ${expected}`, () => {
              expect(lspl.getVatRate(flightType, aircraftOrigin, aircraftCategory)).toBe(expected)
            })
          }
        )
      })
    })
  })
})
