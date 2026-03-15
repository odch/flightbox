// validate.js reads __CONF__ at module load time, so we use
// jest.resetModules() + require() to control the global before each load.

const makeConf = () => ({
  enabledFlightTypes: {0: 'private', 1: 'instruction'},
  aerodrome: {
    runways: {0: {name: '10'}, 1: {name: '28'}},
    departureRoutes: {0: {name: 'north'}, 1: {name: 'south'}},
    arrivalRoutes: {0: {name: 'north'}, 1: {name: 'south'}}
  }
});

describe('components', () => {
  describe('wizards/validate', () => {
    let validate;

    beforeEach(() => {
      global.__CONF__ = makeConf();
      jest.resetModules();
      validate = require('./validate').default;
    });

    describe('basic required field validation', () => {
      it('returns error for missing immatriculation', () => {
        const validateFn = validate('departure', ['immatriculation'], []);
        const errors = validateFn({});
        expect(errors.immatriculation).toBeDefined();
      });

      it('returns no error when immatriculation is present and valid', () => {
        const validateFn = validate('departure', ['immatriculation'], []);
        const errors = validateFn({immatriculation: 'HBKOF'});
        expect(errors.immatriculation).toBeUndefined();
      });

      it('returns error for immatriculation with invalid characters', () => {
        const validateFn = validate('departure', ['immatriculation'], []);
        const errors = validateFn({immatriculation: 'HB-KOF'});
        expect(errors.immatriculation).toBeDefined();
      });
    });

    describe('mtow integer validation', () => {
      it('returns error for non-integer mtow', () => {
        const validateFn = validate('departure', ['mtow'], []);
        const errors = validateFn({mtow: 1.5});
        expect(errors.mtow).toBeDefined();
      });

      it('returns no error for integer mtow', () => {
        const validateFn = validate('departure', ['mtow'], []);
        const errors = validateFn({mtow: 1000});
        expect(errors.mtow).toBeUndefined();
      });
    });

    describe('type-specific messages', () => {
      it('returns departure-specific message for time field', () => {
        const validateFn = validate('departure', ['time'], []);
        const errors = validateFn({});
        expect(errors.time).toBeDefined();
        expect(typeof errors.time).toBe('string');
      });

      it('returns arrival-specific message for time field', () => {
        const validateFnDep = validate('departure', ['time'], []);
        const validateFnArr = validate('arrival', ['time'], []);
        const errorsDep = validateFnDep({});
        const errorsArr = validateFnArr({});
        // They should have different messages for departure vs arrival
        expect(errorsDep.time).not.toBe(errorsArr.time);
      });

      it('returns departure-specific message for location field', () => {
        const validateFn = validate('departure', ['location'], []);
        const errors = validateFn({});
        expect(errors.location).toBeDefined();
      });

      it('returns departure-specific message for runway field', () => {
        const validateFn = validate('departure', ['runway'], []);
        const errors = validateFn({});
        expect(errors.runway).toBeDefined();
      });
    });

    describe('hiddenFields exclusion', () => {
      it('excludes hidden fields from validation', () => {
        const validateFn = validate('departure', ['immatriculation', 'mtow'], ['mtow']);
        const errors = validateFn({});
        expect(errors.immatriculation).toBeDefined();
        expect(errors.mtow).toBeUndefined();
      });

      it('validates all fields when no hidden fields', () => {
        const validateFn = validate('departure', ['immatriculation', 'mtow'], []);
        const errors = validateFn({});
        expect(errors.immatriculation).toBeDefined();
        expect(errors.mtow).toBeDefined();
      });
    });

    describe('flightType validation', () => {
      it('returns error for flight type not in config', () => {
        const validateFn = validate('departure', ['flightType'], []);
        const errors = validateFn({flightType: 'commercial'});
        expect(errors.flightType).toBeDefined();
      });

      it('returns no error for enabled flight type', () => {
        const validateFn = validate('departure', ['flightType'], []);
        const errors = validateFn({flightType: 'private'});
        expect(errors.flightType).toBeUndefined();
      });
    });

    describe('runway validation', () => {
      it('returns error for unknown runway', () => {
        const validateFn = validate('departure', ['runway'], []);
        const errors = validateFn({runway: '99'});
        expect(errors.runway).toBeDefined();
      });

      it('returns no error for valid runway', () => {
        const validateFn = validate('departure', ['runway'], []);
        const errors = validateFn({runway: '10'});
        expect(errors.runway).toBeUndefined();
      });
    });

    describe('getFilteredConfig (via validate)', () => {
      it('only validates requested fields', () => {
        // Only ask for immatriculation, not mtow
        const validateFn = validate('departure', ['immatriculation'], []);
        const errors = validateFn({});
        expect(Object.keys(errors)).toEqual(['immatriculation']);
      });

      it('validates empty field list returns no errors', () => {
        const validateFn = validate('departure', [], []);
        const errors = validateFn({});
        expect(Object.keys(errors)).toHaveLength(0);
      });
    });
  });
});
