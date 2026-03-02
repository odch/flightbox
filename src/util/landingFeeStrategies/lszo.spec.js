import lszo from './lszo';
import {AircraftOrigin} from '../landingFees';

describe('util', () => {
  describe('landingFeeStrategies', () => {
    describe('lszo', () => {
      describe('getLandingFee', () => {
        it('returns helicopter fee for Hubschrauber within max weight', () => {
          const result = lszo.getLandingFee(800, 'private', AircraftOrigin.OTHER, 'Hubschrauber');
          expect(result).toBeDefined();
          expect(result.fee).toBe(46.25);
        });

        it('returns undefined for helicopter above max weight', () => {
          const result = lszo.getLandingFee(2000, 'private', AircraftOrigin.OTHER, 'Hubschrauber');
          expect(result).toBeUndefined();
        });

        it('returns instruction_homebase fee for instruction + home base', () => {
          const result = lszo.getLandingFee(1000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug');
          expect(result).toBeDefined();
          expect(result.fee).toBe(9);
        });

        it('returns instruction_homebase fee for instruction + club', () => {
          const result = lszo.getLandingFee(1000, 'instruction', AircraftOrigin.CLUB, 'Flugzeug');
          expect(result).toBeDefined();
          expect(result.fee).toBe(9);
        });

        it('returns instruction_external fee for instruction + other', () => {
          const result = lszo.getLandingFee(1000, 'instruction', AircraftOrigin.OTHER, 'Flugzeug');
          expect(result).toBeDefined();
          expect(result.fee).toBe(11.10);
        });

        it('returns plane fee for non-instruction non-helicopter (< 1000kg)', () => {
          const result = lszo.getLandingFee(800, 'private', AircraftOrigin.OTHER, 'Flugzeug');
          expect(result).toBeDefined();
          expect(result.fee).toBe(15.73);
        });

        it('returns higher plane fee for mtow between 1000-1999kg', () => {
          const result = lszo.getLandingFee(1500, 'private', AircraftOrigin.OTHER, 'Flugzeug');
          expect(result).toBeDefined();
          expect(result.fee).toBe(17.58);
        });

        it('returns highest plane fee for mtow above 1999kg', () => {
          const result = lszo.getLandingFee(5000, 'private', AircraftOrigin.OTHER, 'Flugzeug');
          expect(result).toBeDefined();
          expect(result.fee).toBe(27.75);
        });
      });

      describe('getGoAroundFee', () => {
        it('always returns undefined', () => {
          expect(lszo.getGoAroundFee(1000, 'private', AircraftOrigin.OTHER, 'Flugzeug')).toBeUndefined();
          expect(lszo.getGoAroundFee(1000, 'instruction', AircraftOrigin.HOME_BASE, 'Hubschrauber')).toBeUndefined();
        });
      });

      describe('getVatRate', () => {
        it('returns 0 for homebase + instruction', () => {
          expect(lszo.getVatRate('instruction', AircraftOrigin.HOME_BASE, 'Flugzeug')).toBe(0);
        });

        it('returns 0 for club + instruction', () => {
          expect(lszo.getVatRate('instruction', AircraftOrigin.CLUB, 'Flugzeug')).toBe(0);
        });

        it('returns 8.1 for other + instruction', () => {
          expect(lszo.getVatRate('instruction', AircraftOrigin.OTHER, 'Flugzeug')).toBe(8.1);
        });

        it('returns 8.1 for homebase + private', () => {
          expect(lszo.getVatRate('private', AircraftOrigin.HOME_BASE, 'Flugzeug')).toBe(8.1);
        });

        it('returns 8.1 for other + private', () => {
          expect(lszo.getVatRate('private', AircraftOrigin.OTHER, 'Flugzeug')).toBe(8.1);
        });
      });
    });
  });
});
