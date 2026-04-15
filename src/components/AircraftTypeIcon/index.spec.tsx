import {getIconName} from './index';

describe('components', () => {
  describe('AircraftTypeIcon', () => {
    describe('getIconName', () => {
      it('returns plane for unknown category with no mtow', () => {
        expect(getIconName(null, undefined)).toBe('plane');
      });

      it('returns helicopter for helicopter category regardless of mtow', () => {
        expect(getIconName('Hubschrauber', 5000)).toBe('helicopter');
      });

      it('returns plane for mtow below jet threshold', () => {
        expect(getIconName(null, 2249)).toBe('plane');
      });

      it('returns jet for mtow exactly at jet threshold (2250)', () => {
        expect(getIconName(null, 2250)).toBe('jet');
      });

      it('returns jet for mtow above jet threshold', () => {
        expect(getIconName(null, 5700)).toBe('jet');
      });

      it('overrides plane category with jet when mtow >= threshold', () => {
        expect(getIconName('Flugzeug', 3000)).toBe('jet');
      });

      it('keeps plane category below threshold', () => {
        expect(getIconName('Flugzeug', 1500)).toBe('plane');
      });

      it('keeps glider category regardless of mtow', () => {
        expect(getIconName('Segelflugzeug', 3000)).toBe('glider');
      });
    });
  });
});
