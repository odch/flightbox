import {frequentAerodromesFrom} from './frequentAerodromes';

describe('util', () => {
  describe('frequentAerodromesFrom', () => {
    const auth = {email: 'pilot@example.com', guest: false, kiosk: false};

    const mv = (location: string, createdBy = auth.email) => ({location, createdBy});

    beforeEach(() => {
      (global as any).__CONF__ = {aerodrome: {ICAO: 'LSZO'}, profileEnabled: true};
    });

    afterEach(() => {
      delete (global as any).__CONF__;
    });

    it('returns the most frequent aerodromes, most frequent first', () => {
      const movements = [
        mv('LSGG'), mv('LSGG'), mv('LSGG'),
        mv('LSZR'), mv('LSZR'),
        mv('LFSB'),
      ];
      expect(frequentAerodromesFrom(movements, auth)).toEqual(['LSGG', 'LSZR', 'LFSB']);
    });

    it('excludes the home aerodrome', () => {
      const movements = [mv('LSZO'), mv('LSZO'), mv('LSGG')];
      expect(frequentAerodromesFrom(movements, auth)).toEqual(['LSGG']);
    });

    it('only counts the current user\'s own movements (createdBy filter)', () => {
      const movements = [
        mv('LSGG', 'other@example.com'),
        mv('LSGG', 'other@example.com'),
        mv('LSZR', auth.email),
      ];
      expect(frequentAerodromesFrom(movements, auth)).toEqual(['LSZR']);
    });

    it('caps the result at 5 entries', () => {
      const movements = [
        mv('AAAA'), mv('BBBB'), mv('CCCC'), mv('DDDD'), mv('EEEE'), mv('FFFF'),
      ];
      expect(frequentAerodromesFrom(movements, auth)).toHaveLength(5);
    });

    it('normalises casing and ignores empty locations', () => {
      const movements = [mv('lsgg'), mv('LSGG'), {location: '', createdBy: auth.email}];
      expect(frequentAerodromesFrom(movements, auth)).toEqual(['LSGG']);
    });

    it('returns [] for guests', () => {
      expect(frequentAerodromesFrom([mv('LSGG')], {...auth, guest: true})).toEqual([]);
    });

    it('returns [] for kiosk', () => {
      expect(frequentAerodromesFrom([mv('LSGG')], {...auth, kiosk: true})).toEqual([]);
    });

    it('returns [] when there is no email', () => {
      expect(frequentAerodromesFrom([mv('LSGG')], {email: null})).toEqual([]);
    });

    it('returns [] when profile is disabled', () => {
      (global as any).__CONF__ = {aerodrome: {ICAO: 'LSZO'}, profileEnabled: false};
      expect(frequentAerodromesFrom([mv('LSGG')], auth)).toEqual([]);
    });

    it('returns [] for empty or missing input', () => {
      expect(frequentAerodromesFrom([], auth)).toEqual([]);
      expect(frequentAerodromesFrom(null, auth)).toEqual([]);
      expect(frequentAerodromesFrom(undefined, auth)).toEqual([]);
    });
  });
});
