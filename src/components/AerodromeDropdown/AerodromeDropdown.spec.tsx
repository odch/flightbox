import {aerodromesComparator} from './AerodromeDropdown';

describe('AerodromeDropdown', () => {
  describe('aerodromesComparator', () => {
    beforeEach(() => {
      (global as any).__CONF__ = {aerodrome: {ICAO: 'LSZO'}};
    });

    afterEach(() => {
      delete (global as any).__CONF__;
    });

    const sortKeys = (keys: string[]) =>
      keys.map(key => ({key, name: key})).sort(aerodromesComparator()).map(a => a.key);

    it('places the home aerodrome first', () => {
      // After home (LSZO), Swiss LS aerodromes rank before non-LS ones.
      expect(sortKeys(['LSGG', 'LSZO', 'LFSB'])).toEqual(['LSZO', 'LSGG', 'LFSB']);
    });

    it('keeps the home aerodrome ahead of other LS aerodromes', () => {
      expect(sortKeys(['LSZR', 'LSGG', 'LSZO'])).toEqual(['LSZO', 'LSGG', 'LSZR']);
    });

    it('still places LS aerodromes before non-LS ones', () => {
      expect(sortKeys(['EDNY', 'LSGG', 'LFSB'])).toEqual(['LSGG', 'EDNY', 'LFSB']);
    });

    it('falls back to alphabetical when no home is configured', () => {
      (global as any).__CONF__ = {};
      expect(sortKeys(['LSZR', 'LSGG', 'LSZO'])).toEqual(['LSGG', 'LSZO', 'LSZR']);
    });
  });
});
