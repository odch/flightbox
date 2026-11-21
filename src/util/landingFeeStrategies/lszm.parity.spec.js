// Parity: the server's port of the Mollis tariff (functions/fees, used by
// computeArrivalFeesOnWrite) prices every arrival like the app's wizard:
// fee and VAT rate, or the same error, for all weight band edges, flight
// types, aircraft origins and categories.
const client = require('./lszm').default;
const server = require('../../../functions/fees/landingFeeStrategies/lszm');
const data = require('./lszm_data.json');
const { categories } = require('../aircraftCategories');

const FLIGHT_TYPES = [
  'private', 'instruction', 'aerotow', 'commercial', 'military',
  'glider_private_aerotow', 'glider_private_winch', 'glider_private_self',
  'glider_instruction_aerotow', 'glider_instruction_winch', 'glider_instruction_self',
];
const ORIGINS = ['club', 'homeBase', 'other'];
const edges = data.fees.non_homebase_plane_helicopter.map(entry => entry.max_weight);
const MTOWS = [0, 1, ...edges.flatMap(edge => [edge - 1, edge, edge + 1]), 60000];

const outcome = fn => {
  try {
    return { value: fn() };
  } catch (e) {
    return { error: e.message };
  }
};

describe('lszm tariff: server and app agree', () => {
  it.each(categories)('for a %s', category => {
    for (const flightType of FLIGHT_TYPES) {
      for (const origin of ORIGINS) {
        expect(outcome(() => server.getVatRate(flightType, origin, category)))
          .toEqual(outcome(() => client.getVatRate(flightType, origin, category)));
        for (const mtow of MTOWS) {
          expect(outcome(() => server.getLandingFee(mtow, flightType, origin, category)))
            .toEqual(outcome(() => client.getLandingFee(mtow, flightType, origin, category)));
        }
      }
    }
  });
});
