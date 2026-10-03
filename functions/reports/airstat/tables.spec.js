'use strict';

const {
  FLIGHT_TYPES,
  AIRCRAFT_CATEGORIES,
  flightTypeAircraftType,
  getAirstatType,
  isHelicopter,
} = require('./tables');

describe('functions', () => {
  describe('reports/airstat/tables', () => {
    describe('tables', () => {
      it('freezes the tables and their entries', () => {
        expect(Object.isFrozen(FLIGHT_TYPES)).toBe(true);
        expect(Object.isFrozen(FLIGHT_TYPES[0])).toBe(true);
        expect(Object.isFrozen(FLIGHT_TYPES[0].airstatType)).toBe(true);
        expect(Object.isFrozen(AIRCRAFT_CATEGORIES)).toBe(true);
        expect(Object.isFrozen(AIRCRAFT_CATEGORIES[0])).toBe(true);
      });

      it('lists 13 flight types and 15 categories', () => {
        expect(FLIGHT_TYPES).toHaveLength(13);
        expect(AIRCRAFT_CATEGORIES).toHaveLength(15);
      });
    });

    describe('getAirstatType', () => {
      it.each([
        ['private', 'Flugzeug', 42],
        ['private', 'Hubschrauber', 64],
        ['private', 'Motorsegler', 53],
        ['instruction', 'Eigenbauhubschrauber', 62],
        ['aerotow', 'Motorsegler', 52],
        ['glider_private_winch', 'Segelflugzeug', 74],
        ['glider_private_aerotow', 'Eigenbausegelflugzeug', 72],
        ['glider_instruction_self', 'Segelflugzeug', 75],
        ['military', 'Trike', 57],
        ['sar', 'Hubschrauber', 66],
      ])('(%s, %s) is %s', (type, category, expected) => {
        expect(getAirstatType(type, category)).toBe(expected);
      });

      it.each([
        ['sar', 'Flugzeug'],
        ['glider_private_winch', 'Flugzeug'],
        ['commercial', 'Segelflugzeug'],
        ['private', undefined],
        ['private', null],
        ['private', ''],
        ['private', 'Unbekannt'],
      ])('(%s, %s) is undefined', (type, category) => {
        expect(getAirstatType(type, category)).toBeUndefined();
      });

      it.each([
        ['unknown', 'Flight type "unknown" not found'],
        [undefined, 'Flight type "undefined" not found'],
        ['constructor', 'Flight type "constructor" not found'],
      ])('throws for flight type %s', (type, message) => {
        expect(() => getAirstatType(type, 'Flugzeug')).toThrow(new Error(message));
      });
    });

    describe('flightTypeAircraftType', () => {
      it('maps categories', () => {
        expect(flightTypeAircraftType('Flugzeug')).toBe('aircraft');
        expect(flightTypeAircraftType('Motorsegler')).toBe('motor_glider');
        expect(flightTypeAircraftType('Eigenbauhubschrauber')).toBe('helicopter');
        expect(flightTypeAircraftType('Segelflugzeug')).toBe('glider');
      });

      it('returns null for a falsy and undefined for an unknown category', () => {
        expect(flightTypeAircraftType(undefined)).toBeNull();
        expect(flightTypeAircraftType(null)).toBeNull();
        expect(flightTypeAircraftType('')).toBeNull();
        expect(flightTypeAircraftType('Unbekannt')).toBeUndefined();
      });
    });

    describe('isHelicopter', () => {
      it.each([
        ['HBXAB', undefined, true],
        ['HB-XAB', undefined, false],
        ['HBZAB', undefined, true],
        ['D-HBXY', undefined, true],
        ['HBX', undefined, true],
        ['hbxab', undefined, false],
        ['HBXAB', '', true],
        ['HBXAB', null, true],
        ['HBKOF', undefined, false],
        [undefined, undefined, false],
        [null, undefined, false],
        ['HBKOF', 'Hubschrauber', true],
        ['HBKOF', 'Eigenbauhubschrauber', true],
        ['HBKOF', 'Flugzeug', false],
        ['HBXAB', 'Flugzeug', false],
        ['HBKOF', 'Unbekannt', false],
        ['HBKOF', 'Hubschrauber ', false],
      ])('(%s, %s) is %s', (registration, category, expected) => {
        expect(isHelicopter(registration, category)).toBe(expected);
      });
    });
  });
});
