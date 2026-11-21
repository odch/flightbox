'use strict';

const { buildMovementPolicy } = require('./policy');
const { loadVariant } = require('./testing/projectPolicies');

const CONFIG = {
  loginForm: 'email',
  lockOnDateTime: false,
  enabledFlightTypes: ['private', 'instruction'],
  aircraftCategories: ['Flugzeug', 'Motorsegler'],
  aerodrome: {
    ICAO: 'LSZE',
    runways: [{ name: '12', type: 'A' }, { name: '30', type: 'A' }],
    departureRoutes: [{ name: 'N' }, { name: 'O' }],
    arrivalRoutes: [{ name: 'W' }],
  },
};

const withConfig = overrides => ({ ...CONFIG, ...overrides });
const withAerodrome = overrides => withConfig({ aerodrome: { ...CONFIG.aerodrome, ...overrides } });

describe('movement domain', () => {
  describe('buildMovementPolicy', () => {
    it('takes the names the database rules accept from the config', () => {
      expect(buildMovementPolicy(CONFIG)).toEqual({
        icao: 'LSZE',
        runways: ['12', '30'],
        departureRoutes: ['N', 'O'],
        arrivalRoutes: ['W'],
        flightTypes: ['private', 'instruction'],
        aircraftCategories: ['Flugzeug', 'Motorsegler'],
        personalAccess: true,
        lockOnDateTime: false,
        noRunwayIfHelicopter: false,
        paymentMethods: [],
        homebasePayment: false,
      });
    });

    it('takes the payment methods and homebasePayment from the config', () => {
      const policy = buildMovementPolicy(withConfig({
        paymentMethods: [{ name: 'checkout', authCondition: 'notKiosk' }, { name: 'invoice' }], homebasePayment: true,
      }));
      expect(policy.paymentMethods).toEqual([{ name: 'checkout', authCondition: 'notKiosk' }, { name: 'invoice' }]);
      expect(policy.homebasePayment).toBe(true);
      expect(loadVariant('lsze').policy.paymentMethods.map(m => m.name)).toEqual(['checkout', 'card_external', 'invoice']);
    });

    it('takes noRunwayIfHelicopter from the aerodrome (only true counts)', () => {
      expect(buildMovementPolicy(withAerodrome({ noRunwayIfHelicopter: true })).noRunwayIfHelicopter).toBe(true);
      expect(buildMovementPolicy(withAerodrome({ noRunwayIfHelicopter: 'yes' })).noRunwayIfHelicopter).toBe(false);
      expect(loadVariant('lsze').policy.noRunwayIfHelicopter).toBe(true);
      expect(loadVariant('lszt').policy.noRunwayIfHelicopter).toBe(false);
    });

    it('scopes movements to their owner only for the e-mail login', () => {
      expect(buildMovementPolicy(withConfig({ loginForm: 'usernamePassword' })).personalAccess).toBe(false);
      expect(buildMovementPolicy(withConfig({ loginForm: 'Email' })).personalAccess).toBe(false);
    });

    it('takes lockOnDateTime from the config', () => {
      expect(buildMovementPolicy(withConfig({ lockOnDateTime: true })).lockOnDateTime).toBe(true);
    });

    it('returns a frozen policy that does not share arrays with the config', () => {
      const config = JSON.parse(JSON.stringify(CONFIG));
      const policy = buildMovementPolicy(config);
      config.enabledFlightTypes.push('aerotow');
      expect(policy.flightTypes).toEqual(['private', 'instruction']);
      expect(Object.isFrozen(policy)).toBe(true);
      expect(Object.isFrozen(policy.runways)).toBe(true);
    });

    it.each([
      ['no config', null],
      ['no aerodrome', withConfig({ aerodrome: undefined })],
      ['no ICAO', withAerodrome({ ICAO: '' })],
      ['runways without names', withAerodrome({ runways: ['12'] })],
      ['no departure routes (config from before this field)', withAerodrome({ departureRoutes: undefined })],
      ['no arrival routes', withAerodrome({ arrivalRoutes: undefined })],
      ['no flight types', withConfig({ enabledFlightTypes: undefined })],
      ['non-string flight types', withConfig({ enabledFlightTypes: ['private', 1] })],
      ['no aircraft categories', withConfig({ aircraftCategories: undefined })],
      ['no loginForm', withConfig({ loginForm: undefined })],
      ['no lockOnDateTime', withConfig({ lockOnDateTime: undefined })],
    ])('rejects a config with %s', (label, config) => {
      expect(() => buildMovementPolicy(config)).toThrow(TypeError);
    });

    it('builds the policies of the real projects from the generated config', () => {
      const lsze = loadVariant('lsze').policy;
      expect(lsze).toMatchObject({
        icao: 'LSZE',
        runways: ['12', '30'],
        departureRoutes: ['N', 'O', 'W'],
        arrivalRoutes: ['N', 'O', 'W'],
        personalAccess: true,
        lockOnDateTime: false,
      });
      expect(lsze.flightTypes).toEqual(expect.arrayContaining(['private', 'military', 'sar', 'glider_private_winch']));
      expect(lsze.aircraftCategories).toContain('Ultraleichtflugzeug (3-Achsen gesteuert)');
      expect(loadVariant('lspv').policy.personalAccess).toBe(false);
      expect(loadVariant('lszt').policy).toMatchObject({ icao: 'LSZT', runways: ['06', '24'] });
      expect(loadVariant('lsze-lockOnDateTime').policy.lockOnDateTime).toBe(true);
    });
  });
});
