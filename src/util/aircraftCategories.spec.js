const {categories, isHelicopter, flightTypeAircraftType, icon} = require('./aircraftCategories');

describe('util', () => {
  describe('aircraftCategories', () => {
    describe('categories', () => {
      it('is an array of category names', () => {
        expect(Array.isArray(categories)).toBe(true);
        expect(categories.length).toBeGreaterThan(0);
        expect(categories).toContain('Flugzeug');
        expect(categories).toContain('Hubschrauber');
      });
    });

    describe('isHelicopter', () => {
      it('returns true for Hubschrauber', () => {
        expect(isHelicopter('Hubschrauber')).toBe(true);
      });

      it('returns true for Eigenbauhubschrauber', () => {
        expect(isHelicopter('Eigenbauhubschrauber')).toBe(true);
      });

      it('returns false for Flugzeug', () => {
        expect(isHelicopter('Flugzeug')).toBe(false);
      });

      it('returns false for Segelflugzeug', () => {
        expect(isHelicopter('Segelflugzeug')).toBe(false);
      });

      it('returns false for undefined', () => {
        expect(isHelicopter(undefined)).toBe(false);
      });
    });

    describe('flightTypeAircraftType', () => {
      it('returns null for null input', () => {
        expect(flightTypeAircraftType(null)).toBeNull();
      });

      it('returns null for undefined input', () => {
        expect(flightTypeAircraftType(undefined)).toBeNull();
      });

      it('returns aircraft for Flugzeug', () => {
        expect(flightTypeAircraftType('Flugzeug')).toBe('aircraft');
      });

      it('returns helicopter for Hubschrauber', () => {
        expect(flightTypeAircraftType('Hubschrauber')).toBe('helicopter');
      });

      it('returns motor_glider for Motorsegler', () => {
        expect(flightTypeAircraftType('Motorsegler')).toBe('motor_glider');
      });

      it('returns glider for Segelflugzeug', () => {
        expect(flightTypeAircraftType('Segelflugzeug')).toBe('glider');
      });

      it('returns undefined for unknown category', () => {
        expect(flightTypeAircraftType('Unknown')).toBeUndefined();
      });
    });

    describe('icon', () => {
      it('returns null for null input', () => {
        expect(icon(null)).toBeNull();
      });

      it('returns null for undefined input', () => {
        expect(icon(undefined)).toBeNull();
      });

      it('returns helicopter icon for Hubschrauber', () => {
        expect(icon('Hubschrauber')).toBe('helicopter');
      });

      it('returns glider icon for Segelflugzeug', () => {
        expect(icon('Segelflugzeug')).toBe('glider');
      });

      it('returns undefined icon for Flugzeug (no icon)', () => {
        expect(icon('Flugzeug')).toBeUndefined();
      });

      it('returns undefined for unknown category', () => {
        expect(icon('Unknown')).toBeUndefined();
      });
    });
  });
});
