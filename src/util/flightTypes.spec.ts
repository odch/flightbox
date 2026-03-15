// flightTypes.js reads __CONF__ at module load time, so we use
// jest.resetModules() + require() to control the global before each load.

describe('util', () => {
  describe('flightTypes', () => {
    let flightTypes;

    beforeEach(() => {
      global.__CONF__ = {
        enabledFlightTypes: {0: 'private', 1: 'instruction'}
      };
      jest.resetModules();
      flightTypes = require('./flightTypes');
    });

    describe('getLabel', () => {
      it('returns translated label for known flight type', () => {
        // i18n returns the key path when translation missing, but de.json has 'Privat'
        const label = flightTypes.getLabel('private');
        expect(typeof label).toBe('string');
        expect(label.length).toBeGreaterThan(0);
      });

      it('throws error for unknown flight type', () => {
        expect(() => flightTypes.getLabel('unknown')).toThrow('Flight type "unknown" not found');
      });
    });

    describe('getAirstatType', () => {
      it('returns airstat type for aircraft category', () => {
        expect(flightTypes.getAirstatType('private', 'Flugzeug')).toBe(42);
      });

      it('returns airstat type for helicopter category', () => {
        expect(flightTypes.getAirstatType('private', 'Hubschrauber')).toBe(64);
      });

      it('returns airstat type for instruction + aircraft', () => {
        expect(flightTypes.getAirstatType('instruction', 'Flugzeug')).toBe(43);
      });
    });

    describe('isHelicopterAirstatType', () => {
      it('returns true for helicopter airstat type 64 (private)', () => {
        expect(flightTypes.isHelicopterAirstatType(64)).toBe(true);
      });

      it('returns true for helicopter airstat type 61 (commercial)', () => {
        expect(flightTypes.isHelicopterAirstatType(61)).toBe(true);
      });

      it('returns false for aircraft-only airstat type', () => {
        expect(flightTypes.isHelicopterAirstatType(42)).toBe(false);
      });

      it('returns false for unknown airstat type', () => {
        expect(flightTypes.isHelicopterAirstatType(999)).toBe(false);
      });
    });

    describe('isPrivateFlightAirstatType', () => {
      it('returns true for private aircraft airstat type (42)', () => {
        expect(flightTypes.isPrivateFlightAirstatType(42)).toBe(true);
      });

      it('returns true for glider private aerotow (72)', () => {
        expect(flightTypes.isPrivateFlightAirstatType(72)).toBe(true);
      });

      it('returns false for instruction airstat type (43)', () => {
        expect(flightTypes.isPrivateFlightAirstatType(43)).toBe(false);
      });
    });

    describe('isInstructionFlightAirstatType', () => {
      it('returns true for instruction aircraft airstat type (43)', () => {
        expect(flightTypes.isInstructionFlightAirstatType(43)).toBe(true);
      });

      it('returns true for glider instruction aerotow (71)', () => {
        expect(flightTypes.isInstructionFlightAirstatType(71)).toBe(true);
      });

      it('returns false for private airstat type (42)', () => {
        expect(flightTypes.isInstructionFlightAirstatType(42)).toBe(false);
      });
    });

    describe('isCommercialFlightAirstatType', () => {
      it('returns true for commercial aircraft airstat type (32)', () => {
        expect(flightTypes.isCommercialFlightAirstatType(32)).toBe(true);
      });

      it('returns false for private airstat type (42)', () => {
        expect(flightTypes.isCommercialFlightAirstatType(42)).toBe(false);
      });
    });

    describe('getEnabledFlightTypes', () => {
      it('returns only types enabled in config and valid for aircraft category', () => {
        const types = flightTypes.getEnabledFlightTypes('Flugzeug');
        const values = types.map(t => t.value);
        expect(values).toContain('private');
        expect(values).toContain('instruction');
      });

      it('excludes types not in config', () => {
        const types = flightTypes.getEnabledFlightTypes('Flugzeug');
        const values = types.map(t => t.value);
        expect(values).not.toContain('commercial');
        expect(values).not.toContain('aerotow');
      });

      it('returns no types for glider when only private/instruction enabled', () => {
        // glider types have airstatType.glider only, not aircraft
        const types = flightTypes.getEnabledFlightTypes('Segelflugzeug');
        // private and instruction have glider airstat types too? Let's check.
        // Looking at flightTypes data: private has motor_glider:53, instruction has motor_glider:53
        // Segelflugzeug maps to 'glider' flightTypeAircraftType
        // Only glider_private_* and glider_instruction_* have 'glider' airstatType
        // Those are NOT in enabledFlightTypes {0: 'private', 1: 'instruction'}
        expect(types).toHaveLength(0);
      });

      it('includes label for each type', () => {
        const types = flightTypes.getEnabledFlightTypes('Flugzeug');
        types.forEach(t => {
          expect(t.label).toBeDefined();
          expect(typeof t.label).toBe('string');
        });
      });
    });
  });
});
