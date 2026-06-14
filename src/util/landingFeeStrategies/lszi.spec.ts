import lszi from './lszi';
import {AircraftOrigin} from '../landingFees';

describe('util', () => {
  describe('landingFeeStrategies', () => {
    describe('lszi', () => {
      describe('getLandingFee', () => {
        it('returns CHF 13 for a plane up to 600 kg', () => {
          const result = lszi.getLandingFee(600, 'private', AircraftOrigin.OTHER, 'Flugzeug');
          expect(result).toBeDefined();
          expect(result!.fee).toBe(13);
        });

        it('returns CHF 19 for a plane between 601 and 1100 kg', () => {
          const result = lszi.getLandingFee(900, 'private', AircraftOrigin.OTHER, 'Flugzeug');
          expect(result).toBeDefined();
          expect(result!.fee).toBe(19);
        });

        it('returns CHF 19 at the 1100 kg boundary', () => {
          const result = lszi.getLandingFee(1100, 'private', AircraftOrigin.OTHER, 'Flugzeug');
          expect(result!.fee).toBe(19);
        });

        it('returns CHF 25 for a plane of 1101 kg and above', () => {
          const result = lszi.getLandingFee(1101, 'private', AircraftOrigin.OTHER, 'Flugzeug');
          expect(result).toBeDefined();
          expect(result!.fee).toBe(25);
        });

        it('returns CHF 13 for any glider regardless of weight', () => {
          const light = lszi.getLandingFee(450, 'private', AircraftOrigin.OTHER, 'Segelflugzeug');
          const heavy = lszi.getLandingFee(750, 'private', AircraftOrigin.OTHER, 'Segelflugzeug');
          expect(light!.fee).toBe(13);
          expect(heavy!.fee).toBe(13);
        });

        it('returns CHF 25 for any helicopter regardless of weight', () => {
          const result = lszi.getLandingFee(800, 'private', AircraftOrigin.OTHER, 'Hubschrauber');
          expect(result).toBeDefined();
          expect(result!.fee).toBe(25);
        });
      });

      describe('getGoAroundFee', () => {
        it('always returns undefined', () => {
          expect(lszi.getGoAroundFee(900, 'private', AircraftOrigin.OTHER, 'Flugzeug')).toBeUndefined();
          expect(lszi.getGoAroundFee(900, 'instruction', AircraftOrigin.HOME_BASE, 'Hubschrauber')).toBeUndefined();
        });
      });

      describe('getVatRate', () => {
        it('always returns 0 (no VAT declared)', () => {
          expect(lszi.getVatRate('private', AircraftOrigin.OTHER, 'Flugzeug')).toBe(0);
          expect(lszi.getVatRate('instruction', AircraftOrigin.HOME_BASE, 'Segelflugzeug')).toBe(0);
        });
      });
    });
  });
});
