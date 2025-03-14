import lszm from './lszm'
import {AircraftOrigin} from '../landingFees'

describe('util', () => {
  describe('landingFeeStrategies', () => {
    describe('lszm', () => {
      describe('getLandingFee ', () => {
        describe.each([
          // non-homebase
          [0, 'private', AircraftOrigin.OTHER, 'Flugzeug', 22.8],
          [0, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 22.8],
          [800, 'private', AircraftOrigin.OTHER, 'Flugzeug', 22.8],
          [800, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 22.8],
          [800, 'private', AircraftOrigin.OTHER, 'Segelflugzeug', 22.8],
          [1000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 27.6],
          [1000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 27.6],
          [1300, 'private', AircraftOrigin.OTHER, 'Flugzeug', 33.6],
          [1300, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 33.6],
          [2000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 38.4],
          [2000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 38.4],
          [3000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 57.6],
          [3000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 57.6],
          [4000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 80.4],
          [4000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 80.4],
          [5000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 105.6],
          [5000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 105.6],
          [6000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 133.2],
          [6000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 133.2],
          [7000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 163.2],
          [7000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 163.2],
          [8000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 194.4],
          [8000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 194.4],
          [9000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 228],
          [9000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 228],
          [10000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 264],
          [10000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 264],
          [12500, 'private', AircraftOrigin.OTHER, 'Flugzeug', 360],
          [12500, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 360],
          [15000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 540],
          [15000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 540],
          [20000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 720],
          [20000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 720],
          [30000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 1080],
          [30000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 1080],
          [40000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 1440],
          [40000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 1440],
          [50000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 2160],
          [50000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 2160],

          // homebase plane (non instruction)
          [0, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 19],
          [800, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 19],
          [800, 'private', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 19],
          [1000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 23],
          [1300, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 28],
          [2000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 32],
          [3000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 48],
          [4000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 67],
          [5000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 88],
          [6000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 111],
          [7000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 136],
          [8000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 162],
          [9000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 190],
          [10000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 220],
          [12500, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 300],
          [15000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 450],
          [20000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 600],
          [30000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 900],
          [40000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 1200],
          [50000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 1800],

          // homebase plane (instruction)
          [0, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 15.2],
          [800, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 15.2],
          [800, 'instruction', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 15.2],
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

          // homebase helicopter
          [0, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 11.4],
          [800, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 11.4],
          [1000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 13.8],
          [1300, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 16.8],
          [2000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 19.2],
          [3000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 28.8],
          [4000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 40.2],
          [5000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 52.8],
          [6000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 66.6],
          [7000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 81.6],
          [8000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 97.2],
          [9000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 114],
          [10000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 132],
          [12500, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 180],
          [15000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 270],
          [20000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 360],
          [30000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 540],
          [40000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 720],
          [50000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 1080],
        ])(
          'getLandingFee(%i, %s, %s)',
          (mtow, flightType, aircraftOrigin, aircraftCategory, expected) => {
            test(`returns ${expected}`, () => {
              expect(lszm.getLandingFee(mtow, flightType, aircraftOrigin, aircraftCategory).fee).toBe(expected);
            });
          }
        )
      })
    })
  })
})
