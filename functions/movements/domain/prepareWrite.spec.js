'use strict';

const { prepareWrite } = require('./prepareWrite');
const { toOrderKey } = require('./orderKey');

const PILOT = { uid: 'pilot-uid', email: 'pilot@example.com', isAdmin: false };
const GUEST = { uid: 'guest', email: null, isAdmin: false };

const DATE_TIME = '2026-06-16T10:00:00.000Z';
const NEGATIVE_TIMESTAMP = -Date.parse(DATE_TIME);

const input = overrides => ({
  aircraftType: 'C172',
  dateTime: DATE_TIME,
  immatriculation: 'HBABC',
  ...overrides,
});

const storedMovement = overrides => ({
  ...input(),
  remarks: 'old',
  negativeTimestamp: NEGATIVE_TIMESTAMP,
  createdBy: PILOT.email,
  createdBy_orderKey: toOrderKey(PILOT.email, NEGATIVE_TIMESTAMP),
  ...overrides,
});

describe('movement domain', () => {
  describe('prepareWrite', () => {
    describe('create', () => {
      it('derives the server-owned fields like the client does', () => {
        const { movement, writtenFields, patch } = prepareWrite({ type: 'departure', actor: PILOT, input: input() });
        expect(movement).toEqual({
          ...input(),
          createdBy: PILOT.email,
          negativeTimestamp: NEGATIVE_TIMESTAMP,
          createdBy_orderKey: toOrderKey(PILOT.email, NEGATIVE_TIMESTAMP),
        });
        expect(writtenFields.sort()).toEqual(Object.keys(movement).sort());
        expect(patch).toEqual(movement);
        expect(patch).not.toBe(movement);
      });

      it('creates ownerless movements for actors without e-mail', () => {
        [GUEST, { uid: 'kiosk' }, { uid: 'x', email: '' }, null].forEach(actor => {
          const { movement } = prepareWrite({ type: 'arrival', actor, input: input() });
          expect(movement).toEqual({ ...input(), negativeTimestamp: NEGATIVE_TIMESTAMP });
        });
      });

      it('ignores client values for the server-owned fields', () => {
        const forged = input({
          createdBy: 'other@example.com',
          createdBy_orderKey: 'other@example.com_1',
          negativeTimestamp: -9999999999999,
        });
        expect(prepareWrite({ type: 'departure', actor: PILOT, input: forged }).movement).toEqual(
          prepareWrite({ type: 'departure', actor: PILOT, input: input() }).movement
        );
        expect(prepareWrite({ type: 'departure', actor: GUEST, input: forged }).movement.createdBy).toBeUndefined();
      });

      it('derives negativeTimestamp from dateTime, never from the client', () => {
        // The documented lock bypass: a recent negativeTimestamp next to a
        // backdated dateTime.
        const backdated = input({ dateTime: '2020-01-01T00:00:00.000Z', negativeTimestamp: NEGATIVE_TIMESTAMP });
        expect(prepareWrite({ type: 'departure', actor: PILOT, input: backdated }).movement.negativeTimestamp)
          .toBe(-Date.parse('2020-01-01T00:00:00.000Z'));
      });

      it('leaves negativeTimestamp unset for a dateTime that is no date', () => {
        ['2026-13-01T00:00:00.000Z', 'soon', 42, undefined].forEach(dateTime => {
          const { movement } = prepareWrite({ type: 'departure', actor: PILOT, input: input({ dateTime }) });
          expect(movement).not.toHaveProperty('negativeTimestamp');
          expect(movement).not.toHaveProperty('createdBy_orderKey');
          expect(movement.createdBy).toBe(PILOT.email);
        });
      });

      it('stores values like the database: no nulls or empty objects, lists as objects', () => {
        const { movement } = prepareWrite({
          type: 'arrival',
          actor: GUEST,
          input: input({ remarks: null, paymentMethod: {}, phone: undefined, customsFormId: ['a'] }),
        });
        expect(movement).toEqual({ ...input(), customsFormId: { 0: 'a' }, negativeTimestamp: NEGATIVE_TIMESTAMP });
      });
    });

    describe('update', () => {
      it('merges the input over the stored movement (top-level keys replaced)', () => {
        const existing = storedMovement({ paymentMethod: { method: 'checkout', status: 'pending' } });
        const { movement, writtenFields, patch } = prepareWrite({
          type: 'arrival',
          actor: PILOT,
          existing,
          input: { paymentMethod: { method: 'cash' } },
        });
        expect(movement).toEqual({ ...existing, paymentMethod: { method: 'cash' } });
        expect(writtenFields).toEqual(['paymentMethod', 'negativeTimestamp', 'createdBy_orderKey']);
        expect(patch).toEqual({
          paymentMethod: { method: 'cash' },
          negativeTimestamp: NEGATIVE_TIMESTAMP,
          createdBy_orderKey: existing.createdBy_orderKey,
        });
      });

      it('removes fields set to null or to an empty object', () => {
        const existing = storedMovement({ paymentMethod: { method: 'cash' } });
        const { movement, patch } = prepareWrite({
          type: 'arrival',
          actor: PILOT,
          existing,
          input: { remarks: null, paymentMethod: {} },
        });
        expect(movement).not.toHaveProperty('remarks');
        expect(movement).not.toHaveProperty('paymentMethod');
        expect(patch).toMatchObject({ remarks: null, paymentMethod: null });
      });

      it('keeps createdBy as stored and rederives the order key', () => {
        const dateTime = '2026-06-20T07:30:00.000Z';
        const { movement } = prepareWrite({
          type: 'departure',
          actor: { uid: 'admin-uid', email: 'admin@example.com', isAdmin: true },
          existing: storedMovement(),
          input: { dateTime, createdBy: 'admin@example.com', createdBy_orderKey: 'x' },
        });
        expect(movement.createdBy).toBe(PILOT.email);
        expect(movement.negativeTimestamp).toBe(-Date.parse(dateTime));
        expect(movement.createdBy_orderKey).toBe(toOrderKey(PILOT.email, -Date.parse(dateTime)));
      });

      it('keeps an ownerless movement ownerless and drops a stale order key', () => {
        const existing = storedMovement({ createdBy: undefined, createdBy_orderKey: 'stale_1' });
        delete existing.createdBy;
        const { movement, patch } = prepareWrite({
          type: 'departure',
          actor: PILOT,
          existing,
          input: { createdBy: PILOT.email, remarks: 'x' },
        });
        expect(movement).not.toHaveProperty('createdBy');
        expect(movement).not.toHaveProperty('createdBy_orderKey');
        expect(patch).toEqual({ remarks: 'x', negativeTimestamp: NEGATIVE_TIMESTAMP, createdBy_orderKey: null });
      });

      it('repairs a stored negativeTimestamp that does not match dateTime', () => {
        const { movement, patch } = prepareWrite({
          type: 'departure',
          actor: PILOT,
          existing: storedMovement({ negativeTimestamp: -1 }),
          input: { remarks: 'x' },
        });
        expect(movement.negativeTimestamp).toBe(NEGATIVE_TIMESTAMP);
        expect(patch.negativeTimestamp).toBe(NEGATIVE_TIMESTAMP);
      });

      it('does not mutate its arguments', () => {
        const existing = storedMovement();
        const update = { remarks: null, dateTime: '2026-06-20T07:30:00.000Z' };
        const copies = JSON.parse(JSON.stringify([existing, update]));
        prepareWrite({ type: 'departure', actor: PILOT, existing, input: update });
        expect([existing, update]).toEqual(copies);
      });
    });

    describe('own "__proto__" keys (JSON.parse input)', () => {
      const USER_WITHOUT_EMAIL = { uid: 'phone-uid', email: null, isAdmin: false };
      const protoInput = proto => Object.assign(JSON.parse(`{"__proto__":${JSON.stringify(proto)}}`), input());

      it('keeps the key as data, so validateMovement sees and rejects it', () => {
        const { movement, writtenFields } = prepareWrite({
          type: 'departure', actor: PILOT, input: protoInput({ passengerCount: 0 }),
        });
        expect(Object.getPrototypeOf(movement)).toBe(Object.prototype);
        expect(Object.keys(movement)).toContain('__proto__');
        expect(writtenFields).toContain('__proto__');
        expect(movement.passengerCount).toBeUndefined();
      });

      it('does not derive the order key from an inherited createdBy', () => {
        const { movement } = prepareWrite({
          type: 'departure', actor: USER_WITHOUT_EMAIL, input: protoInput({ createdBy: 'victim@example.com' }),
        });
        expect(movement.createdBy).toBeUndefined();
        expect(movement).not.toHaveProperty('createdBy_orderKey');
      });

      it('lists the key in the patch of an update', () => {
        const { patch, writtenFields } = prepareWrite({
          type: 'departure',
          actor: PILOT,
          existing: storedMovement(),
          input: JSON.parse('{"__proto__":{"remarks":"x"}}'),
        });
        expect(writtenFields).toContain('__proto__');
        expect(Object.getPrototypeOf(patch)).toBe(Object.prototype);
        expect(Object.prototype.hasOwnProperty.call(patch, '__proto__')).toBe(true);
      });
    });

    it('throws for an unknown type or malformed arguments', () => {
      expect(() => prepareWrite({ type: 'landing', actor: PILOT, input: input() })).toThrow(TypeError);
      expect(() => prepareWrite({ type: 'departure', actor: PILOT, input: null })).toThrow(TypeError);
      expect(() => prepareWrite({ type: 'departure', actor: PILOT, input: [input()] })).toThrow(TypeError);
      expect(() => prepareWrite({ type: 'departure', actor: PILOT, existing: 'x', input: input() })).toThrow(TypeError);
    });
  });
});
