import React from 'react';
import {render} from '@testing-library/react';
import {countryCodeToFlag, formatLocationDisplay} from './locationDisplay';

describe('util', () => {
  describe('locationDisplay', () => {
    beforeEach(() => {
      global.__CONF__ = {aerodrome: {ICAO: 'LSZT'}};
    });

    describe('countryCodeToFlag', () => {
      it('converts valid 2-letter country code to flag emoji', () => {
        const flag = countryCodeToFlag('CH');
        expect(typeof flag).toBe('string');
        expect(flag.length).toBeGreaterThan(0);
      });

      it('returns empty string for null', () => {
        expect(countryCodeToFlag(null as any)).toBe('');
      });

      it('returns empty string for code longer than 2 characters', () => {
        expect(countryCodeToFlag('DEU')).toBe('');
      });

      it('returns empty string for empty string', () => {
        expect(countryCodeToFlag('')).toBe('');
      });

      it('handles lowercase input by converting to uppercase', () => {
        const upper = countryCodeToFlag('CH');
        const lower = countryCodeToFlag('ch');
        expect(upper).toBe(lower);
      });
    });

    describe('formatLocationDisplay', () => {
      it('returns Lokalflug for local ICAO location without circuit route', () => {
        const result = formatLocationDisplay({location: 'LSZT'});
        expect(result).toBe('Lokalflug');
      });

      it('returns Lokalflug for lowercase local ICAO location', () => {
        const result = formatLocationDisplay({location: 'lszt'});
        expect(result).toBe('Lokalflug');
      });

      it('returns Platzrunden for local ICAO with circuits departure route', () => {
        const result = formatLocationDisplay({
          location: 'LSZT',
          departureRoute: 'circuits'
        });
        expect(result).toBe('Platzrunden');
      });

      it('returns Platzrunden for local ICAO with circuits arrival route', () => {
        const result = formatLocationDisplay({
          location: 'LSZT',
          arrivalRoute: 'circuits'
        });
        expect(result).toBe('Platzrunden');
      });

      it('returns plain ICAO string for foreign location without flag or name', () => {
        const result = formatLocationDisplay({location: 'EDDF', locationCountry: 'CH'});
        expect(result).toBe('EDDF');
      });

      it('returns plain ICAO string for foreign location without enriched data', () => {
        const result = formatLocationDisplay({location: 'EDDF'});
        expect(result).toBe('EDDF');
      });

      it('returns JSX with flag for foreign non-CH location with country', () => {
        const result = formatLocationDisplay({
          location: 'EDDF',
          locationCountry: 'DE'
        });
        expect(React.isValidElement(result)).toBe(true);
        const {container} = render(result);
        expect(container.textContent).toContain('EDDF');
      });

      it('returns JSX with name for location with locationName', () => {
        const result = formatLocationDisplay({
          location: 'EDDF',
          locationCountry: 'CH',
          locationName: 'Frankfurt Airport'
        });
        expect(React.isValidElement(result)).toBe(true);
        const {container} = render(result);
        expect(container.textContent).toContain('Frankfurt Airport');
      });

      it('returns JSX with both flag and name for foreign location with both', () => {
        const result = formatLocationDisplay({
          location: 'EDDF',
          locationCountry: 'DE',
          locationName: 'Frankfurt'
        });
        expect(React.isValidElement(result)).toBe(true);
        const {container} = render(result);
        expect(container.textContent).toContain('EDDF');
        expect(container.textContent).toContain('Frankfurt');
      });

      it('respects custom options', () => {
        const result = formatLocationDisplay(
          {location: 'EDDF', locationCountry: 'DE'},
          {lineHeight: 1.5, nameColor: 'red'}
        );
        expect(React.isValidElement(result)).toBe(true);
      });
    });
  });
});
