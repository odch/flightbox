'use strict';

const { checkAppRules } = require('./checkAppRules');
const { REASONS } = require('./reasons');
const { loadVariant } = require('./testing/projectPolicies');

const lsze = loadVariant('lsze').policy; // noRunwayIfHelicopter
const lszt = loadVariant('lszt').policy;

const plane = { immatriculation: 'HBKOF', aircraftCategory: 'Flugzeug', flightType: 'private', runway: '30' };
const create = (movement, policy = lsze) => checkAppRules(movement, policy, { writtenFields: [], isCreate: true });
const update = (movement, writtenFields, policy = lsze) => checkAppRules(movement, policy, { writtenFields, isCreate: false });

const runwayRequired = { field: 'runway', reason: REASONS.REQUIRED };
const notForCategory = { field: 'flightType', reason: REASONS.NOT_FOR_AIRCRAFT_CATEGORY };

describe('movement domain', () => {
  describe('checkAppRules (what the app wizard requires beyond the rules)', () => {
    it('accepts a complete movement', () => {
      expect(create(plane)).toEqual([]);
    });

    describe('runway', () => {
      it('is required on a create', () => {
        expect(create({ ...plane, runway: undefined })).toEqual([runwayRequired]);
        expect(create({ ...plane, runway: null })).toEqual([runwayRequired]);
      });

      it.each(['Hubschrauber', 'Eigenbauhubschrauber'])('is not required for a %s where the aerodrome says so', category => {
        expect(create({ ...plane, aircraftCategory: category, flightType: 'sar', runway: undefined })).toEqual([]);
      });

      it('is required for helicopters where the aerodrome does not say so', () => {
        expect(lszt.noRunwayIfHelicopter).toBe(false);
        expect(create({ ...plane, aircraftCategory: 'Hubschrauber', runway: undefined }, lszt)).toEqual([runwayRequired]);
      });

      it('is checked on an update only when runway or aircraftCategory is written', () => {
        const legacy = { ...plane, runway: undefined };
        expect(update(legacy, ['remarks'])).toEqual([]);
        expect(update(legacy, ['runway'])).toEqual([runwayRequired]);
        expect(update(legacy, ['aircraftCategory'])).toEqual([runwayRequired]);
        expect(update({ ...legacy, aircraftCategory: 'Hubschrauber' }, ['aircraftCategory'])).toEqual([]);
      });
    });

    describe('flight type', () => {
      it.each([
        ['Flugzeug', 'glider_private_winch'],
        ['Flugzeug', 'sar'],
        ['Segelflugzeug', 'private'],
        ['Hubschrauber', 'aerotow'],
        ['Motorsegler', 'military'],
      ])('rejects for a %s: %s', (category, flightType) => {
        expect(create({ ...plane, aircraftCategory: category, flightType })).toEqual([notForCategory]);
      });

      it.each([
        ['Flugzeug', 'aerotow'],
        ['Motorsegler', 'aerotow'],
        ['Segelflugzeug', 'glider_instruction_self'],
        ['Eigenbausegelflugzeug', 'glider_private_aerotow'],
        ['Hubschrauber', 'sar'],
        ['Ballon (Heissluft)', 'private'],
      ])('accepts for a %s: %s', (category, flightType) => {
        expect(create({ ...plane, aircraftCategory: category, flightType })).toEqual([]);
      });

      it('leaves unknown flight types and categories to validateMovement', () => {
        expect(create({ ...plane, flightType: 'not-a-flight-type' })).toEqual([]);
        expect(create({ ...plane, aircraftCategory: 'Rakete' })).toEqual([]);
      });

      it('is checked on an update only when flightType or aircraftCategory is written', () => {
        const legacy = { ...plane, flightType: 'glider_private_winch' };
        expect(update(legacy, ['remarks'])).toEqual([]);
        expect(update(legacy, ['flightType'])).toEqual([notForCategory]);
        expect(update(legacy, ['aircraftCategory'])).toEqual([notForCategory]);
      });
    });

    it('reports both', () => {
      expect(create({ ...plane, runway: undefined, flightType: 'sar' })).toEqual([runwayRequired, notForCategory]);
    });
  });
});
