/** @jest-environment node */
'use strict';

jest.mock('firebase-functions/logger', () => ({ error: jest.fn(), info: jest.fn() }));
jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase-admin/database', () => ({ getDatabase: jest.fn() }));

const express = require('express');
const logger = require('firebase-functions/logger');
const { getAuth } = require('firebase-admin/auth');
const { getDatabase } = require('firebase-admin/database');
const { appAuth, resolveActor, loginActor, bearerToken, requireScope } = require('./appAuth');
const { LoginTokenRejected } = require('./loginTokens');
const { requestId } = require('./requestId');
const { listen } = require('./testing/listen');

function authError(code, message = `Firebase: ${code}`) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// Tokens are "token-<uid>"; admins is the content of /admins.
function fakeAuth({ error } = {}) {
  return {
    verifyIdToken: jest.fn(async token => {
      if (error) {
        throw error;
      }
      if (!token.startsWith('token-')) {
        throw authError('auth/argument-error');
      }
      const uid = token.slice('token-'.length);
      return uid.startsWith('anon')
        ? { uid }
        : { uid, email: `${uid}@example.ch` };
    }),
  };
}

function fakeDb(admins = {}, { error } = {}) {
  return {
    ref: jest.fn(path => ({
      once: async () => {
        if (error) {
          throw error;
        }
        const uid = path.replace('/admins/', '');
        return { val: () => (uid in admins ? admins[uid] : null) };
      },
    })),
  };
}

describe('functions', () => {
  describe('api/http/appAuth', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('bearerToken', () => {
      it.each([
        ['Bearer abc', 'abc'],
        ['bearer abc', 'abc'],
        ['BEARER  abc ', 'abc'],
      ])('reads %j', (header, token) => {
        expect(bearerToken(header)).toBe(token);
      });

      it.each([undefined, '', 'Bearer', 'Bearer ', 'Basic abc', 'Bearer a b'])(
        'rejects %j',
        header => {
          expect(bearerToken(header)).toBeNull();
        }
      );
    });

    describe('resolveActor', () => {
      it('describes a pilot', async () => {
        const db = fakeDb();

        expect(
          await resolveActor({ uid: 'u1', email: 'pilot@example.ch' }, db)
        ).toEqual({
          uid: 'u1',
          email: 'pilot@example.ch',
          isAdmin: false,
          isGuest: false,
          isKiosk: false,
        });
        expect(db.ref).toHaveBeenCalledWith('/admins/u1');
      });

      it('marks admins only for /admins/<uid> === true', async () => {
        const db = fakeDb({ a1: true, a2: 'true', a3: 1 });

        expect((await resolveActor({ uid: 'a1' }, db)).isAdmin).toBe(true);
        expect((await resolveActor({ uid: 'a2' }, db)).isAdmin).toBe(false);
        expect((await resolveActor({ uid: 'a3' }, db)).isAdmin).toBe(false);
      });

      it.each([
        ['guest', { isGuest: true, isKiosk: false }],
        ['kiosk', { isGuest: false, isKiosk: true }],
      ])('recognizes the %s session', async (uid, flags) => {
        expect(await resolveActor({ uid }, fakeDb())).toEqual({
          uid,
          email: null,
          isAdmin: false,
          ...flags,
        });
      });

      it('does not read paths for uids that are no database key', async () => {
        const db = fakeDb();

        const actor = await resolveActor({ uid: 'x/../admins' }, db);

        expect(actor.isAdmin).toBe(false);
        expect(db.ref).not.toHaveBeenCalled();
      });

      it('uses null for a missing or non-string email', async () => {
        expect(
          (await resolveActor({ uid: 'u', email: 42 }, fakeDb())).email
        ).toBeNull();
      });
    });

    describe('middleware', () => {
      let auth;
      let db;
      let server;
      let route;

      beforeAll(async () => {
        const app = express();
        app.use(requestId);
        app.get(
          '/me',
          appAuth({ auth: () => auth, db: () => db }),
          (req, res, next) => route(req, res, next)
        );
        server = await listen(app);
      });

      afterAll(() => server.close());

      beforeEach(() => {
        auth = fakeAuth();
        db = fakeDb({ admin1: true });
        route = (req, res) => res.json(req.actor);
      });

      const get = authorization =>
        server.request('/me', {
          headers: authorization
            ? { Authorization: authorization, 'X-Request-Id': 'trace-0123456789' }
            : {},
        });

      const expectUnauthenticated = async (response, message) => {
        expect(response.status).toBe(401);
        expect(response.headers.get('www-authenticate')).toBe('Bearer');
        expect(response.headers.get('x-request-id')).toBeTruthy();
        expect(await response.json()).toEqual({
          error: { code: 'unauthenticated', message },
        });
      };

      it('sets req.actor for a valid token, checking revocation', async () => {
        const response = await get('Bearer token-admin1');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          uid: 'admin1',
          email: 'admin1@example.ch',
          isAdmin: true,
          isGuest: false,
          isKiosk: false,
        });
        expect(auth.verifyIdToken).toHaveBeenCalledWith('token-admin1', true);
      });

      it('answers 401 without an Authorization header', async () => {
        await expectUnauthenticated(await get(), 'Authentication required');
        expect(auth.verifyIdToken).not.toHaveBeenCalled();
      });

      it('answers 401 for another scheme', async () => {
        await expectUnauthenticated(
          await get('Basic dXNlcjpwYXNz'),
          'Authentication required'
        );
      });

      it.each([
        'auth/argument-error',
        'auth/id-token-expired',
        'auth/id-token-revoked',
        'auth/user-disabled',
        'auth/user-not-found',
      ])('answers 401 when the token is rejected with %s', async code => {
        auth = fakeAuth({ error: authError(code) });

        await expectUnauthenticated(
          await get('Bearer token-u1'),
          'Invalid or expired ID token'
        );
        expect(logger.info).toHaveBeenCalledWith('ID token rejected', {
          requestId: 'trace-0123456789',
          reason: code,
        });
        expect(logger.error).not.toHaveBeenCalled();
      });

      // Messages as firebase-admin words key-fetch failures (checked
      // against a real verifyIdToken with an unreachable cert URL).
      it.each([
        ['auth/internal-error', authError('auth/internal-error')],
        [
          'an unreachable cert endpoint',
          authError(
            'auth/argument-error',
            'Error while making request: getaddrinfo ENOTFOUND ' +
              'www.googleapis.com. Error code: ENOTFOUND'
          ),
        ],
        [
          'a failing cert endpoint',
          authError(
            'auth/argument-error',
            'Error fetching public keys for Google certs: down'
          ),
        ],
        ['auth/quota-exceeded', authError('auth/quota-exceeded')],
        [
          'auth/insufficient-permission',
          authError('auth/insufficient-permission'),
        ],
        ['auth/project-not-found', authError('auth/project-not-found')],
        ['auth/invalid-credential', authError('auth/invalid-credential')],
        ['an error without code', new Error('socket hang up')],
      ])('answers 500 when verification fails with %s', async (_, error) => {
        auth = fakeAuth({ error });

        const response = await get('Bearer token-u1');

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
          error: { code: 'internal', message: 'Internal error' },
        });
        expect(logger.error).toHaveBeenCalledWith(
          'API request failed',
          expect.objectContaining({ requestId: 'trace-0123456789' })
        );
        expect(logger.info).not.toHaveBeenCalled();
      });

      it('answers 500 when the admin lookup fails', async () => {
        db = fakeDb({}, { error: new Error('permission denied at /admins') });

        const response = await get('Bearer token-u1');

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
          error: { code: 'internal', message: 'Internal error' },
        });
        expect(logger.error).toHaveBeenCalledWith(
          'API request failed',
          expect.objectContaining({ requestId: 'trace-0123456789' })
        );
      });

      it('does not catch errors of the following handlers', async () => {
        route = () => {
          throw new Error('route failure');
        };

        const response = await get('Bearer token-u1');

        // Express' own final handler, not the envelope of appAuth.
        expect(response.status).toBe(500);
        expect(response.headers.get('content-type')).not.toMatch(/json/);
      });

      it('describes guest and kiosk sessions', async () => {
        const guest = await (await get('Bearer token-guest')).json();
        const kiosk = await (await get('Bearer token-kiosk')).json();

        expect(guest).toMatchObject({ uid: 'guest', isGuest: true, isKiosk: false });
        expect(kiosk).toMatchObject({ uid: 'kiosk', isGuest: false, isKiosk: true });
      });

      it('gives a null email for tokens without one', async () => {
        const actor = await (await get('Bearer token-anon1')).json();

        expect(actor.email).toBeNull();
      });
    });

    describe('central login tokens', () => {
      let auth;
      let db;
      let loginTokens;
      let server;

      beforeAll(async () => {
        const app = express();
        app.use(requestId);
        app.get(
          '/me',
          appAuth({
            auth: () => auth,
            db: () => db,
            loginTokens: {
              isLoginToken: token => loginTokens.isLoginToken(token),
              verify: token => loginTokens.verify(token),
            },
          }),
          (req, res) => res.json(req.actor)
        );
        server = await listen(app);
      });

      afterAll(() => server.close());

      beforeEach(() => {
        auth = fakeAuth();
        // Even an /admins entry for the uid must not make it an admin.
        db = fakeDb({ 'login:sub-1': true });
        loginTokens = {
          isLoginToken: jest.fn(token => token.startsWith('login.')),
          verify: jest.fn(async () => ({ sub: 'sub-1', email: 'pilot@example.ch', scopes: ['movements:write'] })),
        };
      });

      const get = token => server.request('/me', { headers: { Authorization: `Bearer ${token}` } });

      it('describes the pilot of a login token, never as admin', async () => {
        const response = await get('login.token');

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          uid: 'login:sub-1',
          email: 'pilot@example.ch',
          isAdmin: false,
          isGuest: false,
          isKiosk: false,
          scopes: ['movements:write'],
        });
        expect(loginTokens.verify).toHaveBeenCalledWith('login.token');
        expect(auth.verifyIdToken).not.toHaveBeenCalled();
        expect(db.ref).not.toHaveBeenCalled();
      });

      it('answers 401 for a rejected login token', async () => {
        loginTokens.verify.mockRejectedValue(new LoginTokenRejected('expired'));

        const response = await get('login.token');

        expect(response.status).toBe(401);
        expect(response.headers.get('www-authenticate')).toBe('Bearer');
        expect(await response.json()).toEqual({
          error: { code: 'unauthenticated', message: 'Invalid or expired token' },
        });
        expect(logger.info).toHaveBeenCalledWith('Login token rejected', expect.objectContaining({ reason: 'expired' }));
      });

      it('answers 500 when the login keys cannot be fetched', async () => {
        loginTokens.verify.mockRejectedValue(new Error('Fetching the login keys failed'));

        const response = await get('login.token');

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: { code: 'internal', message: 'Internal error' } });
        expect(logger.error).toHaveBeenCalled();
      });

      it('still verifies Firebase ID tokens with Firebase', async () => {
        const response = await get('token-u1');

        expect(response.status).toBe(200);
        expect((await response.json()).uid).toBe('u1');
        expect(loginTokens.verify).not.toHaveBeenCalled();
        expect(auth.verifyIdToken).toHaveBeenCalledWith('token-u1', true);
      });

      it('builds the actor with the login uid prefix', () => {
        expect(loginActor({ sub: 'abc', email: 'a@b.ch', scopes: ['movements:read'] })).toEqual({
          uid: 'login:abc', email: 'a@b.ch', isAdmin: false, isGuest: false, isKiosk: false, scopes: ['movements:read'],
        });
      });
    });

    describe('requireScope', () => {
      const run = (actor) => {
        const req = { actor, requestId: 'r1', get: () => undefined };
        const res = { status: jest.fn(() => res), json: jest.fn(() => res), set: jest.fn(() => res) };
        const next = jest.fn();
        requireScope('movements:read')(req, res, next);
        return { res, next };
      };

      it('lets Firebase actors (no scopes) and tokens with the scope through', () => {
        expect(run({ uid: 'u1' }).next).toHaveBeenCalled();
        expect(run(loginActor({ sub: 'a', email: 'a@b.ch', scopes: ['movements:read'] })).next).toHaveBeenCalled();
      });

      it('answers 403 insufficient-scope for a token without it', () => {
        const { res, next } = run(loginActor({ sub: 'a', email: 'a@b.ch', scopes: ['movements:write'] }));
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          error: { code: 'permission-denied', message: 'The token does not allow movements:read', details: { reason: 'insufficient-scope' } },
        });
      });
    });

    describe('defaults', () => {
      it('uses the Firebase Admin SDK', async () => {
        const auth = fakeAuth();
        getAuth.mockReturnValue(auth);
        getDatabase.mockReturnValue(fakeDb());
        const req = {
          get: () => 'Bearer token-u1',
          requestId: 'r',
        };
        const next = jest.fn();

        await appAuth()(req, {}, next);

        expect(auth.verifyIdToken).toHaveBeenCalledWith('token-u1', true);
        expect(req.actor.uid).toBe('u1');
        expect(next).toHaveBeenCalled();
      });
    });
  });
});
