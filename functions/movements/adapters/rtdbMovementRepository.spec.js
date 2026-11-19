/** @jest-environment node */
'use strict';

jest.mock('firebase-admin/app', () => ({ getApp: jest.fn() }));
jest.mock('firebase-admin/database', () => ({ getDatabase: jest.fn() }));

const { createRtdbMovementRepository, authOverrideFor } = require('./rtdbMovementRepository');

function fakeDb(data) {
  return {
    ref: jest.fn(path => ({
      once: async () => ({ val: () => (path in data ? data[path] : null) }),
    })),
  };
}

const PILOT = { uid: 'pilot-uid', email: 'pilot@example.com', isAdmin: false };

describe('functions', () => {
  describe('movements/adapters/rtdbMovementRepository', () => {
    describe('authOverrideFor', () => {
      it.each([
        ['a pilot', PILOT, { uid: 'pilot-uid', token: { email: 'pilot@example.com' } }],
        ['an admin', { uid: 'admin-uid', email: 'admin@example.com', isAdmin: true },
          { uid: 'admin-uid', token: { email: 'admin@example.com' } }],
        ['the guest session', { uid: 'guest', email: null, isGuest: true }, { uid: 'guest', token: {} }],
        ['the kiosk session', { uid: 'kiosk', email: null, isKiosk: true }, { uid: 'kiosk', token: {} }],
        ['a user with an empty e-mail', { uid: 'u', email: '' }, { uid: 'u', token: {} }],
      ])('presents %s as the client SDK would', (_, actor, override) => {
        expect(authOverrideFor(actor)).toEqual(override);
      });
    });

    describe('reads', () => {
      it('finds a stored movement or null', async () => {
        const db = fakeDb({ 'departures/k1': { immatriculation: 'HBABC' } });
        const repository = createRtdbMovementRepository({ db: () => db, rest: {} });

        expect(await repository.findMovement('departure', 'k1')).toEqual({ immatriculation: 'HBABC' });
        expect(await repository.findMovement('arrival', 'k1')).toBeNull();
        expect(db.ref.mock.calls.map(([path]) => path)).toEqual(['departures/k1', 'arrivals/k1']);
      });

      it('loads the settings of a movement write', async () => {
        const db = fakeDb({
          'settings/lockDate': 1700000000000,
          'settings/customsDeclarationApp/baseUrl': 'https://customs.example.com/',
        });
        const repository = createRtdbMovementRepository({ db: () => db, rest: {} });

        expect(await repository.loadWriteSettings()).toEqual({
          lockDate: 1700000000000,
          lockDateIso: null,
          customsBaseUrl: 'https://customs.example.com/',
        });
      });

      it('rejects unknown movement types', async () => {
        const repository = createRtdbMovementRepository({ db: () => fakeDb({}), rest: {} });

        await expect(repository.findMovement('departures', 'k1')).rejects.toThrow(TypeError);
      });
    });

    describe('writes', () => {
      it('pushes a new movement as the actor', async () => {
        const rest = { write: jest.fn(async () => ({ name: '-Nnew' })) };
        const repository = createRtdbMovementRepository({ db: () => fakeDb({}), rest });

        expect(await repository.createMovement('arrival', { a: 1 }, PILOT)).toBe('-Nnew');
        expect(rest.write).toHaveBeenCalledWith(
          'POST', 'arrivals', { a: 1 }, { uid: 'pilot-uid', token: { email: 'pilot@example.com' } });
      });

      it('fails when the push answer has no key', async () => {
        const rest = { write: jest.fn(async () => null) };
        const repository = createRtdbMovementRepository({ db: () => fakeDb({}), rest });

        await expect(repository.createMovement('arrival', {}, PILOT)).rejects.toThrow('without the new key');
      });

      it('updates a movement as the actor', async () => {
        const rest = { write: jest.fn(async () => null) };
        const repository = createRtdbMovementRepository({ db: () => fakeDb({}), rest });

        await repository.updateMovement('departure', 'k1', { remarks: null }, { uid: 'guest', email: null });

        expect(rest.write).toHaveBeenCalledWith(
          'PATCH', 'departures/k1', { remarks: null }, { uid: 'guest', token: {} });
      });

      it('passes write failures on', async () => {
        const failure = new Error('denied');
        const rest = { write: jest.fn(async () => { throw failure; }) };
        const repository = createRtdbMovementRepository({ db: () => fakeDb({}), rest });

        await expect(repository.updateMovement('departure', 'k1', {}, PILOT)).rejects.toBe(failure);
      });
    });
  });
});
