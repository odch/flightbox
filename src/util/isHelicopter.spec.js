import isHelicopter from './isHelicopter';

describe('util', () => {
  describe('isHelicopter', () => {
    describe('with aircraft category', () => {
      it('returns true for Hubschrauber', () => {
        expect(isHelicopter('HBXYZ', 'Hubschrauber')).toBe(true);
      });

      it('returns true for Eigenbauhubschrauber', () => {
        expect(isHelicopter('HBXYZ', 'Eigenbauhubschrauber')).toBe(true);
      });

      it('returns false for Flugzeug', () => {
        expect(isHelicopter('HBXYZ', 'Flugzeug')).toBe(false);
      });

      it('returns false for Segelflugzeug', () => {
        expect(isHelicopter('HBXYZ', 'Segelflugzeug')).toBe(false);
      });
    });

    describe('without aircraft category (heuristic)', () => {
      it('returns true for HBX registration', () => {
        expect(isHelicopter('HBXAB', undefined)).toBe(true);
      });

      it('returns true for HBZ registration', () => {
        expect(isHelicopter('HBZCD', undefined)).toBe(true);
      });

      it('returns false for HBY registration', () => {
        expect(isHelicopter('HBYAB', undefined)).toBe(false);
      });

      it('returns false for non-HBX/HBZ registration', () => {
        expect(isHelicopter('HBKOF', undefined)).toBe(false);
      });
    });
  });
});
