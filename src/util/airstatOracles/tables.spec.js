// Oracle: the server flight type and category tables must match the client.
// flightTypes.ts reads __CONF__ at module load time, so the client modules are
// loaded with jest.resetModules() + require() after the global is set.
const engine = require('../../../functions/reports/airstat/tables');
const {mulberry32} = require('../../../functions/reports/airstat/testing/mulberry32');

const EXTRA_FLIGHT_TYPES = [
  'unknown', undefined, null, '', 'constructor', '__proto__', 'Private', 'private ', ['private'],
];
const EXTRA_CATEGORIES = [
  null, undefined, '', 'Unbekannt', 'hubschrauber', 'Hubschrauber ', ' Flugzeug',
  'constructor', '__proto__', ['Hubschrauber'],
];
const REGISTRATIONS = [
  'HBXAB', 'HB-XAB', 'HBZAB', 'D-HBXY', 'HBKOF', 'HBX', 'HBZ', 'hbxab', 'HBxAB', 'HB XAB',
  ' HBXAB', 'HBX\n', undefined, null, '', 42, ['HBXAB'],
];
// Tokens that build hits, near misses ('HBx', 'HB-', 'HBY') and hits at the
// start, inside and at the very end of a registration.
const REGISTRATION_TOKENS = [
  'HBX', 'HBZ', 'HB', 'HB-', 'HBx', 'HBz', 'hBX', 'HB ', 'HBY',
  'X', 'Z', 'x', 'B', 'H', '-', ' ', 'D-', '1', '\n',
];
const SEED = 20261003;
const RANDOM_REGISTRATIONS = 2000;

const outcome = fn => {
  try {
    return {value: fn()};
  } catch (e) {
    return {error: e.name, message: e.message};
  }
};

describe('util', () => {
  describe('airstatOracles/tables', () => {
    let client;

    beforeAll(() => {
      // flightTypes.ts needs the global to load; the report ignores it.
      global.__CONF__ = {enabledFlightTypes: {}};
      jest.resetModules();
      client = {
        flightTypes: require('../flightTypes'),
        aircraftCategories: require('../aircraftCategories'),
        aircraftCategoriesData: require('../aircraftCategoriesData'),
        isHelicopter: require('../isHelicopter').default,
      };
    });

    afterAll(() => {
      delete global.__CONF__;
    });

    const flightTypes = () => [
      ...client.flightTypes.flightTypes.map(type => type.value),
      ...EXTRA_FLIGHT_TYPES,
    ];
    const categories = () => [
      ...client.aircraftCategoriesData.map(category => category.name),
      ...EXTRA_CATEGORIES,
    ];

    it('FLIGHT_TYPES equals the client flightTypes table', () => {
      const expected = client.flightTypes.flightTypes
        .map(({value, airstatType}) => ({value, airstatType}));
      expect(engine.FLIGHT_TYPES).toStrictEqual(expected);
    });

    it('AIRCRAFT_CATEGORIES equals the client aircraftCategoriesData', () => {
      const expected = client.aircraftCategoriesData
        .map(({name, flightTypeAircraftType}) => ({name, flightTypeAircraftType}));
      expect(engine.AIRCRAFT_CATEGORIES).toStrictEqual(expected);
    });

    it('getAirstatType matches for every flight type x category', () => {
      let defined = 0;
      flightTypes().forEach(type => {
        categories().forEach(category => {
          const expected = outcome(() => client.flightTypes.getAirstatType(type, category));
          if (expected.value !== undefined) {
            defined++;
          }
          expect([type, category, outcome(() => engine.getAirstatType(type, category))])
            .toStrictEqual([type, category, expected]);
        });
      });
      expect(defined).toBeGreaterThan(50);
    });

    it('flightTypeAircraftType matches for every category', () => {
      categories().forEach(category => {
        expect([category, engine.flightTypeAircraftType(category)])
          .toStrictEqual([category, client.aircraftCategories.flightTypeAircraftType(category)]);
      });
    });

    it('isHelicopter matches for every registration x category', () => {
      REGISTRATIONS.forEach(registration => {
        categories().forEach(category => {
          expect([registration, category, engine.isHelicopter(registration, category)])
            .toStrictEqual([registration, category, client.isHelicopter(registration, category)]);
        });
      });
    });

    it(`isHelicopter matches on random registrations, no category (seed ${SEED})`, () => {
      const rand = mulberry32(SEED);
      const pick = list => list[Math.floor(rand() * list.length)];
      let helicopters = 0;
      for (let i = 0; i < RANDOM_REGISTRATIONS; i++) {
        const length = Math.floor(rand() * 5);
        let registration = '';
        for (let j = 0; j < length; j++) {
          registration += pick(REGISTRATION_TOKENS);
        }
        const category = pick([undefined, null, '']);
        const expected = client.isHelicopter(registration, category);
        if (expected) {
          helicopters++;
        }
        expect([registration, category, engine.isHelicopter(registration, category)])
          .toStrictEqual([registration, category, expected]);
      }
      expect(helicopters).toBeGreaterThan(RANDOM_REGISTRATIONS / 10);
      expect(helicopters).toBeLessThan(RANDOM_REGISTRATIONS / 2);
    });
  });
});
