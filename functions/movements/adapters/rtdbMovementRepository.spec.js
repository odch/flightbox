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

    describe('movement lists', () => {
      const LOGIN_PILOT = { uid: 'login:sub-1', email: 'pilot@example.com', isAdmin: false, scopes: ['movements:read'] };
      const LOGIN_ADMIN = { uid: 'login:sub-2', email: 'admin@example.com', isAdmin: false, scopes: ['movements:read'] };

      // Firebase users of the app by e-mail.
      function fakeAuth(users) {
        return {
          getUserByEmail: jest.fn(async email => {
            if (!users[email]) {
              const error = new Error('no user');
              error.code = 'auth/user-not-found';
              throw error;
            }
            return { emailVerified: true, disabled: false, ...users[email] };
          }),
        };
      }

      const reader = (data, users = {}) => createRtdbMovementRepository({
        db: () => fakeDb(data), auth: () => fakeAuth(users), rest: {},
      });

      it('loads the /admins and allMovements entries of a Firebase actor', async () => {
        const repository = reader({ 'admins/admin-uid': true, 'logins/op-uid/allMovements': true });

        expect(await repository.loadReaderFacts({ uid: 'admin-uid', email: 'admin@example.com', isAdmin: true }))
          .toEqual({ appUid: 'admin-uid', admin: true, allMovements: false });
        expect(await repository.loadReaderFacts({ uid: 'op-uid', email: null }))
          .toEqual({ appUid: 'op-uid', admin: false, allMovements: true });
        expect(await repository.loadReaderFacts(PILOT)).toEqual({ appUid: 'pilot-uid', admin: false, allMovements: false });
      });

      it('takes the app user with the same verified e-mail for a login caller', async () => {
        const repository = reader({ 'admins/admin-uid': true }, {
          'admin@example.com': { uid: 'admin-uid' },
          'pilot@example.com': { uid: 'pilot-uid' },
        });

        expect(await repository.loadReaderFacts(LOGIN_ADMIN)).toEqual({ appUid: 'admin-uid', admin: true, allMovements: false });
        expect(await repository.loadReaderFacts(LOGIN_PILOT)).toEqual({ appUid: 'pilot-uid', admin: false, allMovements: false });
      });

      it.each([
        ['no app user', {}],
        ['an unverified app user', { 'admin@example.com': { uid: 'admin-uid', emailVerified: false } }],
        ['a disabled app user', { 'admin@example.com': { uid: 'admin-uid', disabled: true } }],
      ])('finds no app user for a login caller with %s', async (_, users) => {
        const repository = reader({ 'admins/admin-uid': true }, users);

        expect(await repository.loadReaderFacts(LOGIN_ADMIN)).toEqual({ appUid: null, admin: false, allMovements: false });
      });

      it('passes other failures of the user lookup on', async () => {
        const failure = Object.assign(new Error('quota'), { code: 'auth/quota-exceeded' });
        const repository = createRtdbMovementRepository({
          db: () => fakeDb({}), auth: () => ({ getUserByEmail: async () => { throw failure; } }), rest: {},
        });

        await expect(repository.loadReaderFacts(LOGIN_ADMIN)).rejects.toBe(failure);
      });

      it('queries the owner\'s index or the timestamp, as the caller, newest first', async () => {
        const rest = {
          read: jest.fn(async () => ({
            older: { negativeTimestamp: -2000 },
            newer: { negativeTimestamp: -3000 },
            broken: 'x',
          })),
        };
        const repository = createRtdbMovementRepository({ db: () => fakeDb({}), rest });
        const caller = { uid: 'login:sub-1', email: 'pilot@example.com' };
        const override = { uid: 'login:sub-1', token: { email: 'pilot@example.com' } };

        const own = await repository.listMovements('arrival', { fromMs: 1000, toMs: 5000, owner: 'pilot@example.com', limit: 11 }, caller);
        await repository.listMovements('departure', { fromMs: 1000, toMs: 5000, owner: null, limit: 11 }, caller);

        expect(own.map(([key]) => key)).toEqual(['newer', 'older']);
        expect(rest.read).toHaveBeenNthCalledWith(1, 'arrivals', {
          orderBy: 'createdBy_orderKey',
          startAt: 'pilot@example.com_9999999994999',
          endAt: 'pilot@example.com_9999999998999',
          limitToFirst: 11,
        }, override);
        expect(rest.read).toHaveBeenNthCalledWith(2, 'departures', {
          orderBy: 'negativeTimestamp', startAt: -5000, endAt: -1000, limitToFirst: 11,
        }, override);
      });

      it('answers an empty list for no result', async () => {
        const repository = createRtdbMovementRepository({ db: () => fakeDb({}), rest: { read: async () => null } });

        expect(await repository.listMovements('arrival', { fromMs: 0, toMs: 1, owner: null, limit: 1 }, { uid: 'u', email: null })).toEqual([]);
      });
    });

    describe('payments', () => {
      it('loads the invoice recipients of the actor and whether the aircraft is home-based', async () => {
        const repository = createRtdbMovementRepository({
          db: () => fakeDb({
            '/settings/invoiceRecipients': [{ name: 'Fluggruppe A', emails: ['pilot@example.com'] }, { name: 'Firma B', emails: ['x@example.com'] }],
            'settings/aircrafts/club': { HBKOF: true },
            'settings/aircrafts/homeBase': { HBPIV: true },
          }),
          rest: {},
        });

        expect(await repository.loadPaymentFacts(PILOT, { immatriculation: 'HBPIV' }))
          .toEqual({ invoiceRecipientNames: ['Fluggruppe A'], isHomeBase: true });
        expect(await repository.loadPaymentFacts({ uid: 'guest', email: null }, { immatriculation: 'HBXYZ' }))
          .toEqual({ invoiceRecipientNames: [], isHomeBase: false });
      });

      it('pushes the card payment as the actor', async () => {
        const rest = { write: jest.fn(async () => ({ name: '-Npay1' })) };
        const repository = createRtdbMovementRepository({ db: () => fakeDb({}), rest });

        expect(await repository.createCardPayment({ amount: 3000 }, PILOT)).toBe('-Npay1');
        expect(rest.write).toHaveBeenCalledWith('POST', 'card-payments', { amount: 3000 }, { uid: 'pilot-uid', token: { email: 'pilot@example.com' } });
      });

      it('waits for the checkout URL or a failure of the payment service', async () => {
        const answers = [{ status: 'pending' }, { status: 'pending', data: 'https://pay.example.com/c/1' }];
        const db = { ref: jest.fn(() => ({ once: async () => ({ val: () => answers.shift() ?? null }) })) };
        const sleep = jest.fn(async () => undefined);
        const repository = createRtdbMovementRepository({ db: () => db, rest: {}, sleep });

        expect(await repository.waitForCheckout('-Npay1')).toEqual({ url: 'https://pay.example.com/c/1' });
        expect(db.ref).toHaveBeenCalledWith('card-payments/-Npay1');
        expect(sleep).toHaveBeenCalledTimes(1);

        const failing = createRtdbMovementRepository({ db: () => fakeDb({ 'card-payments/p2': { status: 'failure' } }), rest: {}, sleep });
        expect(await failing.waitForCheckout('p2')).toEqual({ failed: true });
        const silent = createRtdbMovementRepository({ db: () => fakeDb({}), rest: {}, sleep });
        expect(await silent.waitForCheckout('p3', { timeoutMs: 1000, intervalMs: 500 })).toEqual({ pending: true });
      });
    });
  });
});
