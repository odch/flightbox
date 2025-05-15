import lszm from './lszm'
import {AircraftOrigin} from '../landingFees'

describe('util', () => {
  describe('landingFeeStrategies', () => {
    describe('lszm', () => {
      describe('getLandingFee ', () => {
        describe.each([
          // non-homebase
          [0, 'private', AircraftOrigin.OTHER, 'Flugzeug', 24.65],
          [0, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 24.65],
          [800, 'private', AircraftOrigin.OTHER, 'Flugzeug', 24.65],
          [800, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 24.65],
          [1000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 29.85],
          [1000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 29.85],
          [1300, 'private', AircraftOrigin.OTHER, 'Flugzeug', 36.30],
          [1300, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 36.30],
          [2000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 41.50],
          [2000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 41.50],
          [3000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 62.25],
          [3000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 62.25],
          [4000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 86.9],
          [4000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 86.9],
          [5000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 114.15],
          [5000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 114.15],
          [6000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 144.0],
          [6000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 144.0],
          [7000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 176.4],
          [7000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 176.4],
          [8000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 210.15],
          [8000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 210.15],
          [9000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 246.45],
          [9000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 246.45],
          [10000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 285.4],
          [10000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 285.4],
          [12500, 'private', AircraftOrigin.OTHER, 'Flugzeug', 389.15],
          [12500, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 389.15],
          [15000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 583.75],
          [15000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 583.75],
          [20000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 778.3],
          [20000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 778.3],
          [30000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 1167.5],
          [30000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 1167.5],
          [40000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 1556.65],
          [40000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 1556.65],
          [50000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 2334.95],
          [50000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 2334.95],

          // non-homebase glider
          [0, 'glider_private_self', AircraftOrigin.OTHER, 'Segelflugzeug', 24.65],
          [10000, 'glider_private_self', AircraftOrigin.OTHER, 'Segelflugzeug', 24.65], // mtow doesn't matter
          [0, 'glider_private_winch', AircraftOrigin.OTHER, 'Segelflugzeug', 15.15], // special case: same as homebase
          [10000, 'glider_private_winch', AircraftOrigin.OTHER, 'Segelflugzeug', 15.15], // mtow doesn't matter
          [0, 'glider_private_aerotow', AircraftOrigin.OTHER, 'Segelflugzeug', undefined], // fee due for towing plane only
          [10000, 'glider_private_aerotow', AircraftOrigin.OTHER, 'Segelflugzeug', undefined], // fee due for towing plane only

          // homebase plane (non instruction)
          [0, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 20.55],
          [800, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 20.55],
          [1000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 24.85],
          [1300, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 30.25],
          [2000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 34.6],
          [3000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 51.9],
          [4000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 72.45],
          [5000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 95.15],
          [6000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 120],
          [7000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 147],
          [8000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 175.1],
          [9000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 205.4],
          [10000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 237.8],
          [12500, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 324.3],
          [15000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 486.45],
          [20000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 648.6],
          [30000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 972.9],
          [40000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 1297.2],
          [50000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 1945.8],

          // homebase glider (non instruction)
          [0, 'glider_private_self', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 20.55],
          [10000, 'glider_private_self', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 20.55], // mtow doesn't matter
          [0, 'glider_private_winch', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 15.15],
          [10000, 'glider_private_winch', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 15.15], // mtow doesn't matter
          [0, 'glider_private_aerotow', AircraftOrigin.HOME_BASE, 'Segelflugzeug', undefined], // fee due for towing plane only
          [10000, 'glider_private_aerotow', AircraftOrigin.HOME_BASE, 'Segelflugzeug', undefined], // fee due for towing plane only

          // homebase plane (instruction)
          [0, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 15.2],
          [800, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 15.2],
          [1000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 18.4],
          [1300, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 22.4],
          [2000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 25.6],
          [3000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 38.4],
          [4000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 53.6],
          [5000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 70.4],
          [6000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 88.8],
          [7000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 108.8],
          [8000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 129.6],
          [9000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 152],
          [10000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 176],
          [12500, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 240],
          [15000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 360],
          [20000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 480],
          [30000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 720],
          [40000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 960],
          [50000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 1440],

          // homebase glider (instruction)
          [0, 'glider_instruction_self', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 15.2],
          [10000, 'glider_instruction_self', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 15.2], // mtow doesn't matter
          [0, 'glider_instruction_winch', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 11.2],
          [10000, 'glider_instruction_winch', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 11.2], // mtow doesn't matter
          [0, 'glider_instruction_aerotow', AircraftOrigin.HOME_BASE, 'Segelflugzeug', undefined], // fee due for towing plane only
          [10000, 'glider_instruction_aerotow', AircraftOrigin.HOME_BASE, 'Segelflugzeug', undefined], // fee due for towing plane only

          // homebase helicopter
          [0, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 12.3],
          [800, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 12.3],
          [1000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 14.9],
          [1300, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 18.15],
          [2000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 20.75],
          [3000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 31.15],
          [4000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 43.45],
          [5000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 57.1],
          [6000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 72],
          [7000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 88.2],
          [8000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 105.05],
          [9000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 123.25],
          [10000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 142.7],
          [12500, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 194.6],
          [15000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 291.85],
          [20000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 389.15],
          [30000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 583.75],
          [40000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 778.3],
          [50000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 1167.5],
        ])(
          'getLandingFee(%i, %s, %s)',
          (mtow, flightType, aircraftOrigin, aircraftCategory, expected) => {
            test(`returns ${expected}`, () => {
              const landingFee = lszm.getLandingFee(mtow, flightType, aircraftOrigin, aircraftCategory)
              if (expected === undefined) {
                expect(landingFee).toBe(undefined)
              } else {
                expect(landingFee.fee).toBe(expected);
              }
            });
          }
        )
      })
    })
  })
})
