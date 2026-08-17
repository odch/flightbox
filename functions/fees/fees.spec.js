'use strict';

const { computeFees, getAircraftOrigin, AircraftOrigin } = require('./index');
const lspl = require('./landingFeeStrategies/lspl');

// These tables are copied verbatim from src/util/landingFeeStrategies/lspl.spec.ts.
// They are the parity contract: the server strategy MUST return the same fee
// the client shows, or customers are charged an amount different from what they
// were quoted.
const LANDING_FEE_CASES = [
  [0, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],
  [1000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],
  [2000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],
  [50000, 'private', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],
  [1000, 'private', AircraftOrigin.CLUB, 'Flugzeug', 7],
  [1000, 'private', AircraftOrigin.HOME_BASE, 'Motorsegler', 7],
  [1000, 'private', AircraftOrigin.HOME_BASE, 'Eigenbauflugzeug', 7],
  [1000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],
  [1000, 'instruction', AircraftOrigin.CLUB, 'Flugzeug', 7],
  [2000, 'instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 7],
  [0, 'glider_private_self', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 7],
  [0, 'glider_private_winch', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 7],
  [0, 'glider_instruction_self', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 7],
  [0, 'glider_instruction_winch', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 7],
  [0, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 7],
  [2000, 'private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 7],
  [1000, 'instruction', AircraftOrigin.HOME_BASE, 'Eigenbauhubschrauber', 7],
  [0, 'private', AircraftOrigin.OTHER, 'Flugzeug', 18.5],
  [500, 'private', AircraftOrigin.OTHER, 'Flugzeug', 18.5],
  [1000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 18.5],
  [1001, 'private', AircraftOrigin.OTHER, 'Flugzeug', 23.13],
  [2000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 23.13],
  [50000, 'private', AircraftOrigin.OTHER, 'Flugzeug', 23.13],
  [50001, 'private', AircraftOrigin.OTHER, 'Flugzeug', undefined],
  [800, 'private', AircraftOrigin.OTHER, 'Motorsegler', 18.5],
  [1500, 'private', AircraftOrigin.OTHER, 'Motorsegler', 23.13],
  [0, 'glider_private_self', AircraftOrigin.OTHER, 'Segelflugzeug', 18.5],
  [0, 'glider_private_winch', AircraftOrigin.OTHER, 'Segelflugzeug', 18.5],
  [800, 'instruction', AircraftOrigin.OTHER, 'Flugzeug', 18.5],
  [2000, 'instruction', AircraftOrigin.OTHER, 'Flugzeug', 23.13],
  [800, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 18.5],
  [1500, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 23.13],
  [50000, 'private', AircraftOrigin.OTHER, 'Hubschrauber', 23.13],
  [50001, 'private', AircraftOrigin.OTHER, 'Hubschrauber', undefined],
  [1000, 'private', AircraftOrigin.OTHER, 'Eigenbauhubschrauber', 18.5],
  [800, 'aerotow', AircraftOrigin.HOME_BASE, 'Flugzeug', 8],
  [800, 'aerotow', AircraftOrigin.CLUB, 'Flugzeug', 8],
  [800, 'aerotow', AircraftOrigin.OTHER, 'Flugzeug', 8],
  [2000, 'aerotow', AircraftOrigin.OTHER, 'Flugzeug', 8],
  [0, 'glider_private_aerotow', AircraftOrigin.HOME_BASE, 'Segelflugzeug', undefined],
  [0, 'glider_private_aerotow', AircraftOrigin.OTHER, 'Segelflugzeug', undefined],
  [0, 'glider_instruction_aerotow', AircraftOrigin.HOME_BASE, 'Segelflugzeug', undefined],
  [0, 'glider_instruction_aerotow', AircraftOrigin.OTHER, 'Segelflugzeug', undefined],
  [0, 'private', AircraftOrigin.OTHER, 'Ballon (Heissluft)', 18.5],
  [0, 'private', AircraftOrigin.HOME_BASE, 'Ballon (Heissluft)', 18.5],
  [0, 'private', AircraftOrigin.OTHER, 'Ballon (Gas)', 18.5],
  [0, 'private', AircraftOrigin.OTHER, 'Luftschiff (Heissluft)', 18.5],
];

const VAT_CASES = [
  ['private', AircraftOrigin.HOME_BASE, 'Flugzeug', 0],
  ['private', AircraftOrigin.CLUB, 'Flugzeug', 0],
  ['instruction', AircraftOrigin.HOME_BASE, 'Flugzeug', 0],
  ['instruction', AircraftOrigin.CLUB, 'Flugzeug', 0],
  ['private', AircraftOrigin.HOME_BASE, 'Hubschrauber', 0],
  ['private', AircraftOrigin.HOME_BASE, 'Motorsegler', 0],
  ['glider_private_self', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 0],
  ['glider_private_winch', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 0],
  ['aerotow', AircraftOrigin.HOME_BASE, 'Flugzeug', 0],
  ['aerotow', AircraftOrigin.OTHER, 'Flugzeug', 0],
  ['glider_private_aerotow', AircraftOrigin.HOME_BASE, 'Segelflugzeug', 0],
  ['glider_instruction_aerotow', AircraftOrigin.OTHER, 'Segelflugzeug', 0],
  ['private', AircraftOrigin.OTHER, 'Flugzeug', 8.1],
  ['instruction', AircraftOrigin.OTHER, 'Flugzeug', 8.1],
  ['private', AircraftOrigin.OTHER, 'Hubschrauber', 8.1],
  ['private', AircraftOrigin.OTHER, 'Motorsegler', 8.1],
  ['glider_private_self', AircraftOrigin.OTHER, 'Segelflugzeug', 8.1],
  ['glider_private_winch', AircraftOrigin.OTHER, 'Segelflugzeug', 8.1],
  ['private', AircraftOrigin.OTHER, 'Ballon (Heissluft)', 8.1],
  ['private', AircraftOrigin.HOME_BASE, 'Ballon (Heissluft)', 8.1],
  ['private', AircraftOrigin.OTHER, 'Ballon (Gas)', 8.1],
  ['private', AircraftOrigin.OTHER, 'Luftschiff (Heissluft)', 8.1],
];

describe('functions/fees (lspl strategy — client parity)', () => {
  describe('getLandingFee', () => {
    it.each(LANDING_FEE_CASES)(
      'getLandingFee(%i, %s, %s, %s) === %s',
      (mtow, flightType, aircraftOrigin, aircraftCategory, expected) => {
        const result = lspl.getLandingFee(mtow, flightType, aircraftOrigin, aircraftCategory);
        if (expected === undefined) {
          expect(result).toBeUndefined();
        } else {
          expect(result.fee).toBe(expected);
        }
      }
    );
  });

  describe('getGoAroundFee', () => {
    it('always returns undefined for lspl', () => {
      expect(lspl.getGoAroundFee(1000, 'private', AircraftOrigin.OTHER, 'Flugzeug')).toBeUndefined();
      expect(lspl.getGoAroundFee(800, 'aerotow', AircraftOrigin.HOME_BASE, 'Flugzeug')).toBeUndefined();
    });
  });

  describe('getVatRate', () => {
    it.each(VAT_CASES)(
      'getVatRate(%s, %s, %s) === %s',
      (flightType, aircraftOrigin, aircraftCategory, expected) => {
        expect(lspl.getVatRate(flightType, aircraftOrigin, aircraftCategory)).toBe(expected);
      }
    );
  });

  describe('computeFees (totals + rounding)', () => {
    it('non-homebase plane, 1 landing: net + 8.1% VAT, rounded to 5 cents', () => {
      const fees = computeFees({
        strategy: 'lspl',
        mtow: 1001,
        flightType: 'private',
        aircraftOrigin: AircraftOrigin.OTHER,
        aircraftCategory: 'Flugzeug',
        landingCount: 1,
      });
      expect(fees.landingFeeSingle).toBe(23.13);
      expect(fees.landingFeeTotal).toBe(23.13);
      expect(fees.feeTotalNet).toBe(23.13);
      expect(fees.feeVat).toBe(1.87); // round(23.13 * 0.081, 1c)
      expect(fees.feeTotalGross).toBe(25); // 23.13 + 1.87 = 25.00, 5-cent rounded
      expect(fees.feeRoundingDifference).toBe(0);
    });

    it('homebase plane, 2 landings: no VAT', () => {
      const fees = computeFees({
        strategy: 'lspl',
        mtow: 1000,
        flightType: 'private',
        aircraftOrigin: AircraftOrigin.HOME_BASE,
        aircraftCategory: 'Flugzeug',
        landingCount: 2,
      });
      expect(fees.landingFeeSingle).toBe(7);
      expect(fees.landingFeeTotal).toBe(14);
      expect(fees.feeTotalNet).toBe(14);
      expect(fees.feeVat).toBe(0);
      expect(fees.feeTotalGross).toBe(14);
    });

    it('returns an empty object when inputs are incomplete', () => {
      expect(computeFees({ strategy: 'lspl', flightType: 'private' })).toEqual({});
      expect(computeFees({ strategy: 'lspl', mtow: 1000, aircraftOrigin: AircraftOrigin.OTHER })).toEqual({});
    });

    it('throws for a strategy that is not available server-side', () => {
      expect(() => computeFees({ strategy: 'lszt', mtow: 1000, flightType: 'private', aircraftOrigin: AircraftOrigin.OTHER, aircraftCategory: 'Flugzeug', landingCount: 1 }))
        .toThrow(/Unknown landing-fee strategy/);
    });
  });

  describe('getAircraftOrigin', () => {
    const settings = { club: { 'HBABC': true }, homeBase: { 'HBXYZ': true } };
    it('classifies club, home-base, other, and unknown', () => {
      expect(getAircraftOrigin('HBABC', settings)).toBe(AircraftOrigin.CLUB);
      expect(getAircraftOrigin('HBXYZ', settings)).toBe(AircraftOrigin.HOME_BASE);
      expect(getAircraftOrigin('HBZZZ', settings)).toBe(AircraftOrigin.OTHER); // unknown reg -> OTHER (no discount)
      expect(getAircraftOrigin(undefined, settings)).toBeUndefined();
    });
  });
});
