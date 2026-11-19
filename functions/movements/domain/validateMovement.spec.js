'use strict';

const { validateMovement } = require('./validateMovement');
const { REASONS } = require('./reasons');
const { loadVariant } = require('./testing/projectPolicies');
const { departureInput, arrivalInput, withOwnProto } = require('./testing/movementCases');

const { policy } = loadVariant('lsze');

const departure = overrides => ({
  negativeTimestamp: -1781604000000,
  ...departureInput(policy, overrides),
});

const arrival = overrides => ({
  negativeTimestamp: -1781604000000,
  ...arrivalInput(policy, overrides),
});

describe('movement domain', () => {
  describe('validateMovement', () => {
    it('accepts valid movements', () => {
      expect(validateMovement('departure', departure(), policy)).toEqual([]);
      expect(validateMovement('arrival', arrival(), policy)).toEqual([]);
    });

    it('throws for an unknown type or a movement that is not an object', () => {
      expect(() => validateMovement('landing', departure(), policy)).toThrow(TypeError);
      expect(() => validateMovement('toString', departure(), policy)).toThrow(TypeError);
      expect(() => validateMovement('departure', null, policy)).toThrow(TypeError);
      expect(() => validateMovement('departure', ['x'], policy)).toThrow(TypeError);
    });

    it('reports every problem, required fields first, then by field name', () => {
      const movement = departure({ mtow: 0, aircraftType: '', foo: 1 });
      delete movement.email;
      expect(validateMovement('departure', movement, policy)).toEqual([
        { field: 'email', reason: REASONS.REQUIRED },
        { field: 'aircraftType', reason: REASONS.EMPTY },
        { field: 'foo', reason: REASONS.UNKNOWN_FIELD },
        { field: 'mtow', reason: REASONS.MUST_BE_POSITIVE },
      ]);
    });

    describe('writtenFields', () => {
      const legacy = departure({ aircraftType: 'X'.repeat(30), legacyField: 1 });

      it('validates every field when omitted (a create)', () => {
        expect(validateMovement('departure', legacy, policy)).toEqual([
          { field: 'aircraftType', reason: REASONS.TOO_LONG },
          { field: 'legacyField', reason: REASONS.UNKNOWN_FIELD },
        ]);
      });

      it('validates only the written fields, like the database on update()', () => {
        expect(validateMovement('departure', legacy, policy, { writtenFields: ['remarks'] })).toEqual([]);
        expect(validateMovement('departure', legacy, policy, { writtenFields: ['aircraftType', 'aircraftType'] }))
          .toEqual([{ field: 'aircraftType', reason: REASONS.TOO_LONG }]);
      });

      it('always checks the required fields', () => {
        const movement = departure();
        delete movement.duration;
        expect(validateMovement('departure', movement, policy, { writtenFields: [] }))
          .toEqual([{ field: 'duration', reason: REASONS.REQUIRED }]);
      });

      it('does not validate removed fields', () => {
        expect(validateMovement('departure', departure(), policy, { writtenFields: ['remarks', 'foo'] })).toEqual([]);
      });
    });

    it.each([
      'hasOwnProperty', 'valueOf', 'propertyIsEnumerable', '__defineGetter__',
      'toLocaleString', 'constructor', 'toString', 'isPrototypeOf', '__proto__',
    ])('reports the field %s as unknown, not as a check of Object.prototype', field => {
      const movement = departure();
      Object.defineProperty(movement, field, { value: 'x', enumerable: true });
      expect(validateMovement('departure', movement, policy))
        .toEqual([{ field, reason: REASONS.UNKNOWN_FIELD }]);
    });

    describe('own "__proto__" keys (JSON.parse input)', () => {
      it('does not read passengerCount through the prototype', () => {
        const movement = Object.setPrototypeOf(departure({ carriageVoucher: 'garbage' }), { passengerCount: 0 });
        expect(validateMovement('departure', movement, policy))
          .toEqual([{ field: 'carriageVoucher', reason: REASONS.NOT_ALLOWED }]);
      });

      it('does not read the payment method through the prototype', () => {
        const paymentMethod = Object.setPrototypeOf({ status: 'pending' }, { method: 'cash' });
        expect(validateMovement('arrival', arrival({ paymentMethod }), policy))
          .toEqual([{ field: 'paymentMethod.method', reason: REASONS.REQUIRED }]);
      });

      it('does not read the location through the prototype', () => {
        const movement = Object.setPrototypeOf(departure({ departureRoute: 'circuits' }), { location: policy.icao });
        delete movement.location;
        expect(validateMovement('departure', movement, policy)).toEqual([
          { field: 'location', reason: REASONS.REQUIRED },
          { field: 'departureRoute', reason: REASONS.CIRCUITS_NOT_LOCAL },
        ]);
      });

      // Stricter than the rules, which accept extra children here: no client
      // sends the key, and stored it would be a prototype for some readers.
      it('rejects the key inside paymentMethod even with a method', () => {
        const paymentMethod = withOwnProto({ x: 1 }, { method: 'cash' });
        expect(validateMovement('arrival', arrival({ paymentMethod }), policy))
          .toEqual([{ field: 'paymentMethod', reason: REASONS.INVALID_KEY }]);
      });
    });

    describe('keys of nested values', () => {
      it.each(['a.b', 'a/b', '$a', 'a#', 'a[0]', 'x]', '', 'tab\there', 'del\u007f'])('rejects the key %j', key => {
        const movement = arrival({ paymentMethod: { method: 'cash', [key]: 'x' } });
        expect(validateMovement('arrival', movement, policy))
          .toEqual([{ field: 'paymentMethod', reason: REASONS.INVALID_KEY }]);
      });

      it('rejects invalid keys at any depth and in any object value', () => {
        const movement = departure({ passengerCount: 0, carriageVoucher: { ok: { 'a.b': 1 } } });
        expect(validateMovement('departure', movement, policy))
          .toEqual([{ field: 'carriageVoucher', reason: REASONS.INVALID_KEY }]);
      });

      it('allows keys up to 768 UTF-8 bytes', () => {
        const atLimit = arrival({ paymentMethod: { method: 'cash', ['ä'.repeat(384)]: 1 } });
        const overLimit = arrival({ paymentMethod: { method: 'cash', ['ä'.repeat(384) + 'a']: 1 } });
        const emoji = arrival({ paymentMethod: { method: 'cash', ['\u{1F6E9}'.repeat(192)]: 1 } });
        expect(validateMovement('arrival', atLimit, policy)).toEqual([]);
        expect(validateMovement('arrival', emoji, policy)).toEqual([]);
        expect(validateMovement('arrival', overLimit, policy))
          .toEqual([{ field: 'paymentMethod', reason: REASONS.INVALID_KEY }]);
      });
    });

    it('accepts any customs form URL under an empty base URL', () => {
      expect(validateMovement('departure', departure({ customsFormUrl: 'x' }), policy, { customsBaseUrl: '' }))
        .toEqual([]);
    });

    it('accepts circuits anywhere when the project configures a route of that name', () => {
      const withCircuits = { ...policy, departureRoutes: [...policy.departureRoutes, 'circuits'] };
      expect(validateMovement('departure', departure({ departureRoute: 'circuits' }), withCircuits)).toEqual([]);
      expect(validateMovement('departure', departure({ departureRoute: 'circuits' }), policy))
        .toEqual([{ field: 'departureRoute', reason: REASONS.CIRCUITS_NOT_LOCAL }]);
    });

    it('checks circuits against the resulting location', () => {
      const movement = departure({ departureRoute: 'circuits', location: 42 });
      expect(validateMovement('departure', movement, policy)).toEqual([
        { field: 'departureRoute', reason: REASONS.CIRCUITS_NOT_LOCAL },
        { field: 'location', reason: REASONS.NOT_A_STRING },
      ]);
    });

    it('rejects non-finite numbers', () => {
      expect(validateMovement('departure', departure({ mtow: Infinity }), policy))
        .toEqual([{ field: 'mtow', reason: REASONS.NOT_A_NUMBER }]);
      expect(validateMovement('departure', departure({ negativeTimestamp: NaN }), policy))
        .toEqual([{ field: 'negativeTimestamp', reason: REASONS.NOT_A_NUMBER }]);
    });

    it('validates the server-owned fields too', () => {
      expect(validateMovement('departure', departure({ createdBy: 5, createdBy_orderKey: 'x'.repeat(321) }), policy))
        .toEqual([
          { field: 'createdBy', reason: REASONS.NOT_A_STRING },
          { field: 'createdBy_orderKey', reason: REASONS.TOO_LONG },
        ]);
    });

    it('does not mutate the movement', () => {
      const movement = arrival({ paymentMethod: { method: 'cash' } });
      const copy = JSON.parse(JSON.stringify(movement));
      validateMovement('arrival', movement, policy, { writtenFields: Object.keys(movement) });
      expect(movement).toEqual(copy);
    });
  });
});
