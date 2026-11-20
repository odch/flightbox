/** @jest-environment node */
'use strict';

jest.mock('firebase-functions/logger', () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }));
jest.mock('firebase-admin/auth', () => ({ getAuth: jest.fn() }));
jest.mock('firebase-admin/database', () => ({ getDatabase: jest.fn() }));
jest.mock('firebase-admin/app', () => ({ getApp: jest.fn() }));

const express = require('express');
const logger = require('firebase-functions/logger');
const { registerMovementRoutes } = require('./movementRoutes');
const { RulesRejectedError } = require('../adapters/databaseRest');
const { listen } = require('../../api/http/testing/listen');
const { loadVariant } = require('../domain/testing/projectPolicies');
const { departureInput, arrivalInput, stored, DATE_TIME } = require('../domain/testing/movementCases');
const { toOrderKey } = require('../domain/orderKey');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { createLoginTokenVerifier } = require('../../api/http/loginTokens');

const KEY = '-Nabc123_XYZ-def4567';
const NEGATIVE_TIMESTAMP = -Date.parse(DATE_TIME);

// Tokens are "token-<uid>"; these uids have an e-mail address.
const EMAILS = {
  'pilot-uid': 'pilot@example.com',
  'other-uid': 'other@example.com',
  'admin-uid': 'admin@example.com',
};
const ADMINS = { 'admin-uid': true };

function fakeAuth() {
  return {
    verifyIdToken: jest.fn(async token => {
      if (!token.startsWith('token-')) {
        const error = new Error('bad token');
        error.code = 'auth/argument-error';
        throw error;
      }
      const uid = token.slice('token-'.length);
      return EMAILS[uid] ? { uid, email: EMAILS[uid] } : { uid };
    }),
  };
}

function fakeDb() {
  return {
    ref: path => ({
      once: async () => ({ val: () => ADMINS[path.replace('/admins/', '')] ?? null }),
    }),
  };
}

// In-memory repository: `movements` maps "<type>/<key>" to the movement.
function fakeRepository({ movements = {}, settings = {} } = {}) {
  return {
    movements,
    findMovement: jest.fn(async (type, key) => movements[`${type}/${key}`] ?? null),
    loadWriteSettings: jest.fn(async () => ({
      lockDate: null, lockDateIso: null, customsBaseUrl: null, ...settings,
    })),
    createMovement: jest.fn(async () => 'new-key'),
    updateMovement: jest.fn(async () => undefined),
  };
}

// {a: {a: ... 1}}, `depth` levels deep.
function nested(depth) {
  let value = 1;
  for (let i = 0; i < depth; i += 1) {
    value = { a: value };
  }
  return value;
}

const actor = (uid, isAdmin = false) => ({
  uid,
  email: EMAILS[uid] || null,
  isAdmin,
  isGuest: uid === 'guest',
  isKiosk: uid === 'kiosk',
});

describe('functions', () => {
  describe('movements/http/movementRoutes', () => {
    const { serverConfig, policy } = loadVariant('lsze');
    let server;
    let repository;

    beforeAll(async () => {
      const app = express();
      // Each request uses the current repository.
      registerMovementRoutes(app, serverConfig, {
        auth: fakeAuth,
        db: fakeDb,
        repository: new Proxy({}, { get: (_, method) => repository[method] }),
      });
      server = await listen(app);
    });

    afterAll(() => server.close());

    beforeEach(() => {
      jest.clearAllMocks();
      repository = fakeRepository();
    });

    const send = (method, path, { uid = 'pilot-uid', body, raw } = {}) =>
      server.request(path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(uid ? { Authorization: `Bearer token-${uid}` } : {}),
        },
        body: raw !== undefined ? raw : JSON.stringify(body),
      });

    const expectError = async (response, status, error) => {
      expect(response.status).toBe(status);
      expect(response.headers.get('x-request-id')).toBeTruthy();
      expect(await response.json()).toEqual({ error });
    };

    const storeDeparture = (key, overrides) => {
      repository.movements[`departure/${key}`] = stored('departure', policy, overrides);
    };
    const storeArrival = (key, overrides) => {
      repository.movements[`arrival/${key}`] = stored('arrival', policy, overrides);
    };

    describe('POST /api/app/movements/:type', () => {
      it('creates a departure owned by the pilot', async () => {
        const response = await send('POST', '/api/app/movements/departures', { body: departureInput(policy) });

        expect(response.status).toBe(201);
        expect(response.headers.get('x-request-id')).toBeTruthy();
        expect(await response.json()).toEqual({ key: 'new-key' });
        expect(repository.createMovement).toHaveBeenCalledWith('departure', {
          ...departureInput(policy),
          createdBy: 'pilot@example.com',
          negativeTimestamp: NEGATIVE_TIMESTAMP,
          createdBy_orderKey: toOrderKey('pilot@example.com', NEGATIVE_TIMESTAMP),
        }, actor('pilot-uid'));
        expect(repository.findMovement).not.toHaveBeenCalled();
      });

      it('creates an arrival on the path without /api', async () => {
        const response = await send('POST', '/app/movements/arrivals', { body: arrivalInput(policy) });

        expect(response.status).toBe(201);
        expect(repository.createMovement).toHaveBeenCalledWith(
          'arrival', expect.objectContaining({ createdBy: 'pilot@example.com' }), actor('pilot-uid'));
      });

      it('ignores client values of server-owned fields', async () => {
        const body = {
          ...departureInput(policy),
          createdBy: 'other@example.com',
          createdBy_orderKey: 'other@example.com_1',
          negativeTimestamp: -1,
        };

        expect((await send('POST', '/api/app/movements/departures', { body })).status).toBe(201);
        expect(repository.createMovement.mock.calls[0][1]).toEqual(expect.objectContaining({
          createdBy: 'pilot@example.com',
          negativeTimestamp: NEGATIVE_TIMESTAMP,
        }));
      });

      it.each(['guest', 'kiosk'])('creates an ownerless movement for the %s session', async uid => {
        const response = await send('POST', '/api/app/movements/departures', { uid, body: departureInput(policy) });

        expect(response.status).toBe(201);
        const [, movement, writer] = repository.createMovement.mock.calls[0];
        expect(movement).not.toHaveProperty('createdBy');
        expect(movement).not.toHaveProperty('createdBy_orderKey');
        expect(writer).toEqual(actor(uid));
      });

      it('answers 400 with the validation errors', async () => {
        const body = departureInput(policy, { runway: '99', mtow: 0, departureRoute: undefined });

        await expectError(await send('POST', '/api/app/movements/departures', { body }), 400, {
          code: 'invalid-argument',
          message: 'Validation failed',
          details: {
            reason: 'validation-failed',
            validationErrors: [
              { field: 'departureRoute', reason: 'required' },
              { field: 'mtow', reason: 'must-be-positive' },
              { field: 'runway', reason: 'not-allowed' },
            ],
          },
        });
        expect(repository.createMovement).not.toHaveBeenCalled();
      });

      it('answers 400 for a movement the app would not record', async () => {
        const body = departureInput(policy, { runway: undefined, aircraftCategory: 'Segelflugzeug', flightType: 'private' });

        await expectError(await send('POST', '/api/app/movements/departures', { body }), 400, {
          code: 'invalid-argument',
          message: 'Validation failed',
          details: {
            reason: 'validation-failed',
            validationErrors: [
              { field: 'runway', reason: 'required' },
              { field: 'flightType', reason: 'not-for-aircraft-category' },
            ],
          },
        });
        expect(repository.createMovement).not.toHaveBeenCalled();
      });

      it('reports validation errors before the lock', async () => {
        repository = fakeRepository({ settings: { lockDate: Date.parse('2026-12-01T00:00:00.000Z') } });
        const body = departureInput(policy, { dateTime: undefined });

        const response = await send('POST', '/api/app/movements/departures', { body });

        expect(response.status).toBe(400);
        expect((await response.json()).error.details.validationErrors).toEqual(
          expect.arrayContaining([{ field: 'dateTime', reason: 'required' }]));
      });

      it('checks the customs form URL against the configured base URL', async () => {
        repository = fakeRepository({ settings: { customsBaseUrl: 'https://customs.example.com/' } });
        const body = departureInput(policy, { customsFormUrl: 'https://evil.example.com/form' });

        const response = await send('POST', '/api/app/movements/departures', { body });

        expect(response.status).toBe(400);
        expect((await response.json()).error.details.validationErrors).toEqual([
          { field: 'customsFormUrl', reason: 'invalid-prefix' },
        ]);
      });

      it('answers 409 for a movement in a locked period', async () => {
        repository = fakeRepository({ settings: { lockDate: Date.parse('2026-06-30T00:00:00.000Z') } });

        await expectError(
          await send('POST', '/api/app/movements/departures', { body: departureInput(policy) }),
          409,
          { code: 'failed-precondition', message: 'Movement is locked', details: { reason: 'movement-locked' } }
        );
        expect(repository.createMovement).not.toHaveBeenCalled();
      });

      it('answers 403 for a user without e-mail who is no shared session', async () => {
        await expectError(
          await send('POST', '/api/app/movements/departures', { uid: 'phone-uid', body: departureInput(policy) }),
          403,
          { code: 'permission-denied', message: 'Not allowed to write this movement', details: { reason: 'not-owner' } }
        );
      });

      it('answers 401 without a token', async () => {
        await expectError(
          await send('POST', '/api/app/movements/departures', { uid: null, body: departureInput(policy) }),
          401,
          { code: 'unauthenticated', message: 'Authentication required' }
        );
        expect(repository.loadWriteSettings).not.toHaveBeenCalled();
      });

      it('answers 401 for a rejected token', async () => {
        const response = await server.request('/api/app/movements/departures', {
          method: 'POST',
          headers: { Authorization: 'Bearer forged', 'Content-Type': 'application/json' },
          body: JSON.stringify(departureInput(policy)),
        });

        await expectError(response, 401, { code: 'unauthenticated', message: 'Invalid or expired ID token' });
      });

      it('answers 404 for an unknown movement type', async () => {
        await expectError(
          await send('POST', '/api/app/movements/landings', { body: departureInput(policy) }),
          404,
          { code: 'not-found', message: 'Unknown movement type', details: { reason: 'unknown-movement-type' } }
        );
      });

      it('answers 400 for an array as body', async () => {
        await expectError(await send('POST', '/api/app/movements/departures', { raw: '[]' }), 400, {
          code: 'invalid-argument',
          message: 'The body must be a JSON object',
          details: { reason: 'invalid-body' },
        });
      });

      // The JSON parser is strict: only objects and arrays at the top.
      it.each([
        ['malformed JSON', '{"a":'],
        ['a string', '"departure"'],
        ['null', 'null'],
      ])('answers 400 for %s as body', async (_, raw) => {
        await expectError(await send('POST', '/api/app/movements/departures', { raw }), 400, {
          code: 'invalid-argument',
          message: 'Malformed request body',
          details: { reason: 'malformed-body' },
        });
      });

      it('answers 400 for a body that is not JSON', async () => {
        const response = await server.request('/api/app/movements/departures', {
          method: 'POST',
          headers: { Authorization: 'Bearer token-pilot-uid', 'Content-Type': 'text/plain' },
          body: 'aircraftType=C172',
        });

        expect(response.status).toBe(400);
        expect((await response.json()).error.details).toEqual({ reason: 'invalid-body' });
      });

      it('answers 400 for a body of another content type', async () => {
        const response = await server.request('/api/app/movements/departures', {
          method: 'POST',
          headers: { Authorization: 'Bearer token-pilot-uid', 'Content-Type': 'application/octet-stream' },
          body: JSON.stringify(departureInput(policy)),
        });

        await expectError(response, 400, {
          code: 'invalid-argument',
          message: 'The body must be a JSON object',
          details: { reason: 'invalid-body' },
        });
        expect(repository.createMovement).not.toHaveBeenCalled();
      });

      it('answers 400 without logging an error for a deeply nested body', async () => {
        const body = { ...departureInput(policy), remarks: nested(4000) };

        await expectError(await send('POST', '/api/app/movements/departures', { body }), 400, {
          code: 'invalid-argument',
          message: 'The body is nested too deeply',
          details: { reason: 'invalid-body' },
        });
        expect(logger.error).not.toHaveBeenCalled();
        expect(repository.createMovement).not.toHaveBeenCalled();
      });

      it('answers 400 for a body with too many fields', async () => {
        const body = departureInput(policy);
        for (let i = 0; i < 100; i += 1) {
          body[`field${i}`] = 1;
        }

        await expectError(await send('POST', '/api/app/movements/departures', { body }), 400, {
          code: 'invalid-argument',
          message: 'The body has too many fields',
          details: { reason: 'invalid-body' },
        });
      });

      it('answers 400 for a body over 64 KB', async () => {
        const body = { ...departureInput(policy), remarks: 'x'.repeat(64 * 1024) };

        await expectError(await send('POST', '/api/app/movements/departures', { body }), 400, {
          code: 'invalid-argument',
          message: 'Malformed request body',
          details: { reason: 'body-too-large' },
        });
      });
    });

    describe('PATCH /api/app/movements/:type/:key', () => {
      it('merges the fields into the pilot\'s movement', async () => {
        storeDeparture(KEY, { createdBy: 'pilot@example.com', remarks: 'old' });

        const response = await send('PATCH', `/api/app/movements/departures/${KEY}`, {
          body: { remarks: 'new', phone: null },
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ key: KEY });
        expect(repository.findMovement).toHaveBeenCalledWith('departure', KEY);
        expect(repository.updateMovement).toHaveBeenCalledWith('departure', KEY, {
          remarks: 'new',
          phone: null,
          negativeTimestamp: NEGATIVE_TIMESTAMP,
          createdBy_orderKey: toOrderKey('pilot@example.com', NEGATIVE_TIMESTAMP),
        }, actor('pilot-uid'));
      });

      it('derives negativeTimestamp from a changed dateTime', async () => {
        storeDeparture(KEY, { createdBy: 'pilot@example.com' });
        const dateTime = '2026-07-01T08:00:00.000Z';

        expect((await send('PATCH', `/app/movements/departures/${KEY}`, { body: { dateTime } })).status).toBe(200);
        expect(repository.updateMovement.mock.calls[0][2]).toEqual({
          dateTime,
          negativeTimestamp: -Date.parse(dateTime),
          createdBy_orderKey: toOrderKey('pilot@example.com', -Date.parse(dateTime)),
        });
      });

      it('sets only the payment method of an arrival', async () => {
        storeArrival(KEY, { createdBy: 'pilot@example.com' });
        const paymentMethod = { method: 'invoice', invoiceRecipientName: 'Motorfluggruppe' };

        const response = await send('PATCH', `/api/app/movements/arrivals/${KEY}`, { body: { paymentMethod } });

        expect(response.status).toBe(200);
        expect(repository.updateMovement).toHaveBeenCalledWith('arrival', KEY, {
          paymentMethod,
          negativeTimestamp: NEGATIVE_TIMESTAMP,
          createdBy_orderKey: toOrderKey('pilot@example.com', NEGATIVE_TIMESTAMP),
        }, actor('pilot-uid'));
      });

      it('rejects an unknown payment method', async () => {
        storeArrival(KEY, { createdBy: 'pilot@example.com' });

        const response = await send('PATCH', `/api/app/movements/arrivals/${KEY}`, {
          body: { paymentMethod: { method: 'bitcoin' } },
        });

        expect(response.status).toBe(400);
        expect((await response.json()).error.details.validationErrors).toEqual([
          { field: 'paymentMethod.method', reason: 'not-allowed' },
        ]);
        expect(repository.updateMovement).not.toHaveBeenCalled();
      });

      it('answers 403 for another pilot\'s movement', async () => {
        storeDeparture(KEY, { createdBy: 'other@example.com' });

        await expectError(
          await send('PATCH', `/api/app/movements/departures/${KEY}`, { body: { remarks: 'mine now' } }),
          403,
          { code: 'permission-denied', message: 'Not allowed to write this movement', details: { reason: 'not-owner' } }
        );
        expect(repository.updateMovement).not.toHaveBeenCalled();
      });

      it('answers 403 rather than the validation errors of another pilot\'s movement', async () => {
        storeDeparture(KEY, { createdBy: 'other@example.com' });

        const response = await send('PATCH', `/api/app/movements/departures/${KEY}`, {
          body: { mtow: -1, runway: '99' },
        });

        expect(response.status).toBe(403);
        expect((await response.json()).error).not.toHaveProperty('details.validationErrors');
      });

      it('answers 409 for a locked movement', async () => {
        storeDeparture(KEY, { createdBy: 'pilot@example.com' });
        repository.loadWriteSettings.mockResolvedValue({
          lockDate: Date.parse('2026-06-30T00:00:00.000Z'), lockDateIso: null, customsBaseUrl: null,
        });

        await expectError(
          await send('PATCH', `/api/app/movements/departures/${KEY}`, { body: { remarks: 'late' } }),
          409,
          { code: 'failed-precondition', message: 'Movement is locked', details: { reason: 'movement-locked' } }
        );
      });

      it('lets an admin edit any movement', async () => {
        storeDeparture(KEY, { createdBy: 'other@example.com' });

        const response = await send('PATCH', `/api/app/movements/departures/${KEY}`, {
          uid: 'admin-uid',
          body: { remarks: 'checked' },
        });

        expect(response.status).toBe(200);
        const [, , patch, writer] = repository.updateMovement.mock.calls[0];
        expect(patch.createdBy_orderKey).toBe(toOrderKey('other@example.com', NEGATIVE_TIMESTAMP));
        expect(writer).toEqual(actor('admin-uid', true));
      });

      it.each(['guest', 'kiosk'])('lets the %s session edit ownerless movements only', async uid => {
        storeDeparture(KEY);
        storeDeparture('owned', { createdBy: 'pilot@example.com' });

        const ownerless = await send('PATCH', `/api/app/movements/departures/${KEY}`, { uid, body: { remarks: 'x' } });
        const owned = await send('PATCH', '/api/app/movements/departures/owned', { uid, body: { remarks: 'x' } });

        expect(ownerless.status).toBe(200);
        expect(repository.updateMovement).toHaveBeenCalledWith(
          'departure', KEY, { remarks: 'x', negativeTimestamp: NEGATIVE_TIMESTAMP, createdBy_orderKey: null }, actor(uid));
        expect(owned.status).toBe(403);
        expect(repository.updateMovement).toHaveBeenCalledTimes(1);
      });

      it('answers 404 for an unknown key', async () => {
        await expectError(
          await send('PATCH', `/api/app/movements/departures/${KEY}`, { body: { remarks: 'x' } }),
          404,
          { code: 'not-found', message: 'Movement not found', details: { reason: 'not-found' } }
        );
        expect(repository.updateMovement).not.toHaveBeenCalled();
      });

      it('does not look up a key outside the push-key characters', async () => {
        const response = await send('PATCH', '/api/app/movements/departures/a%2Eb', { body: { remarks: 'x' } });

        await expectError(response, 404, {
          code: 'not-found', message: 'Movement not found', details: { reason: 'not-found' },
        });
        expect(repository.findMovement).not.toHaveBeenCalled();
      });

      it('answers 404 for an unknown movement type', async () => {
        const response = await send('PATCH', `/api/app/movements/movements/${KEY}`, { body: { remarks: 'x' } });

        expect(response.status).toBe(404);
        expect((await response.json()).error.details).toEqual({ reason: 'unknown-movement-type' });
      });

      it('does not find a departure key among the arrivals', async () => {
        storeDeparture(KEY, { createdBy: 'pilot@example.com' });

        const response = await send('PATCH', `/api/app/movements/arrivals/${KEY}`, { body: { remarks: 'x' } });

        expect(response.status).toBe(404);
        expect(repository.findMovement).toHaveBeenCalledWith('arrival', KEY);
      });

      it('answers 401 without a token', async () => {
        const response = await send('PATCH', `/api/app/movements/departures/${KEY}`, { uid: null, body: {} });

        expect(response.status).toBe(401);
        expect(repository.findMovement).not.toHaveBeenCalled();
      });
    });

    describe('failures', () => {
      it('answers 500 and logs the disagreement when the rules reject an accepted write', async () => {
        repository.createMovement.mockRejectedValue(new RulesRejectedError('departures'));

        const response = await send('POST', '/api/app/movements/departures', { body: departureInput(policy) });

        await expectError(response, 500, { code: 'internal', message: 'Internal error' });
        expect(logger.error).toHaveBeenCalledWith(
          'Movement write rejected by database rules after the domain accepted it',
          expect.objectContaining({
            requestId: response.headers.get('x-request-id'),
            type: 'departure',
            key: null,
            uid: 'pilot-uid',
          })
        );
      });

      it('answers 500 when the repository fails', async () => {
        storeDeparture(KEY, { createdBy: 'pilot@example.com' });
        repository.updateMovement.mockRejectedValue(new Error('socket hang up'));

        const response = await send('PATCH', `/api/app/movements/departures/${KEY}`, { body: { remarks: 'x' } });

        await expectError(response, 500, { code: 'internal', message: 'Internal error' });
        expect(logger.error).toHaveBeenCalledWith('API request failed', expect.anything());
        expect(logger.error).not.toHaveBeenCalledWith(
          'Movement write rejected by database rules after the domain accepted it', expect.anything());
      });

      it('answers 500 when the settings cannot be read', async () => {
        repository.loadWriteSettings.mockRejectedValue(new Error('permission denied'));

        const response = await send('POST', '/api/app/movements/departures', { body: departureInput(policy) });

        await expectError(response, 500, { code: 'internal', message: 'Internal error' });
      });
    });

    // What @google-cloud/functions-framework mounts before any route: every
    // content type parsed, up to 1 GB, the bytes kept in req.rawBody.
    function useFunctionsFrameworkParsers(app) {
      const options = { limit: '1024mb', verify: (req, res, buffer) => { req.rawBody = buffer; } };
      app.use(express.json(options));
      app.use(express.text(options));
      app.use(express.urlencoded({ ...options, extended: true }));
      app.use(express.raw({ ...options, type: '*/*' }));
    }

    describe('behind the Cloud Functions body parsers', () => {
      let framework;

      beforeAll(async () => {
        const app = express();
        useFunctionsFrameworkParsers(app);
        registerMovementRoutes(app, serverConfig, {
          auth: fakeAuth,
          db: fakeDb,
          repository: new Proxy({}, { get: (_, method) => repository[method] }),
        });
        framework = await listen(app);
      });

      afterAll(() => framework.close());

      const post = (contentType, body) => framework.request('/api/app/movements/departures', {
        method: 'POST',
        headers: { Authorization: 'Bearer token-guest', 'Content-Type': contentType },
        body,
      });

      const invalidBody = message => ({
        code: 'invalid-argument', message, details: { reason: 'invalid-body' },
      });

      it('creates a movement from a JSON body', async () => {
        const response = await post('application/json', JSON.stringify(departureInput(policy)));

        expect(response.status).toBe(201);
        expect(repository.createMovement).toHaveBeenCalledTimes(1);
      });

      it('answers 400 for a binary body instead of checking it byte by byte', async () => {
        const response = await post('application/octet-stream', Buffer.alloc(200000, 65));

        await expectError(response, 400, invalidBody('The body must be a JSON object'));
        expect(repository.createMovement).not.toHaveBeenCalled();
      });

      it('answers 400 for a URL-encoded body', async () => {
        const response = await post('application/x-www-form-urlencoded', 'immatriculation=HBABC&runway[a]=1');

        await expectError(response, 400, invalidBody('The body must be a JSON object'));
      });

      it('answers 400 for a JSON body over 64 KB', async () => {
        const body = { ...departureInput(policy), remarks: 'x'.repeat(64 * 1024) };

        await expectError(await post('application/json', JSON.stringify(body)), 400, {
          code: 'invalid-argument',
          message: 'Malformed request body',
          details: { reason: 'body-too-large' },
        });
        expect(repository.createMovement).not.toHaveBeenCalled();
      });

      it('answers 400 for a deeply nested JSON body', async () => {
        const body = { ...departureInput(policy), remarks: nested(4000) };

        await expectError(await post('application/json', JSON.stringify(body)), 400,
          invalidBody('The body is nested too deeply'));
        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    describe('with tokens of the central login (centralLogin)', () => {
      const CENTRAL_LOGIN = {
        issuer: 'https://login.example.ch',
        jwksUri: 'https://login.example.ch/jwks',
        audience: 'flightbox-lsze-test',
      };
      const SUB = '7f3c1a52-0d7e-4c43-9a55-2a1f1a0e8b11';
      const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
      const jwks = { keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'k1', alg: 'ES256', use: 'sig' }] };
      let login;
      let withoutConfig;

      // What the login issues to the hub by token exchange.
      const loginToken = (claims = {}, audience = CENTRAL_LOGIN.audience) => jwt.sign(
        { sub: SUB, email: 'pilot@example.com', email_verified: true, scope: 'movements:write', ...claims },
        privateKey,
        { algorithm: 'ES256', issuer: CENTRAL_LOGIN.issuer, audience, expiresIn: 300, header: { typ: 'at+jwt', kid: 'k1', alg: 'ES256' } }
      );

      const loginActorOf = (email = 'pilot@example.com') => ({
        uid: `login:${SUB}`, email, isAdmin: false, isGuest: false, isKiosk: false,
      });

      beforeAll(async () => {
        const fetchImpl = jest.fn(async () => ({ ok: true, status: 200, json: async () => jwks }));
        const repositoryProxy = new Proxy({}, { get: (_, method) => repository[method] });
        const app = express();
        registerMovementRoutes(app, { ...serverConfig, centralLogin: CENTRAL_LOGIN }, {
          auth: fakeAuth,
          db: fakeDb,
          repository: repositoryProxy,
          loginTokens: createLoginTokenVerifier(CENTRAL_LOGIN, { fetchImpl }),
        });
        login = await listen(app);

        const plain = express();
        registerMovementRoutes(plain, serverConfig, { auth: fakeAuth, db: fakeDb, repository: repositoryProxy });
        withoutConfig = await listen(plain);
      });

      afterAll(() => Promise.all([login.close(), withoutConfig.close()]));

      const sendWith = (target, method, path, token, body) => target.request(path, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      it('creates a departure owned by the pilot of the token', async () => {
        const response = await sendWith(login, 'POST', '/api/app/movements/departures', loginToken(), departureInput(policy));

        expect(response.status).toBe(201);
        expect(repository.createMovement).toHaveBeenCalledWith('departure', {
          ...departureInput(policy),
          createdBy: 'pilot@example.com',
          negativeTimestamp: NEGATIVE_TIMESTAMP,
          createdBy_orderKey: toOrderKey('pilot@example.com', NEGATIVE_TIMESTAMP),
        }, loginActorOf());
      });

      it('updates the pilot\'s own movement, also one recorded in the app', async () => {
        storeArrival(KEY, { createdBy: 'pilot@example.com' });

        const response = await sendWith(login, 'PATCH', `/api/app/movements/arrivals/${KEY}`, loginToken(), { landingCount: 2 });

        expect(response.status).toBe(200);
        expect(repository.updateMovement).toHaveBeenCalledWith(
          'arrival', KEY, expect.objectContaining({ landingCount: 2 }), loginActorOf());
      });

      it('answers 403 for a movement of another pilot', async () => {
        storeArrival(KEY, { createdBy: 'other@example.com' });

        const response = await sendWith(login, 'PATCH', `/api/app/movements/arrivals/${KEY}`, loginToken(), { landingCount: 2 });

        expect(response.status).toBe(403);
        expect(repository.updateMovement).not.toHaveBeenCalled();
      });

      it('answers 401 for a token of another instance or without the scope', async () => {
        for (const token of [loginToken({}, 'flightbox-lszt-prod'), loginToken({ scope: 'openid' }), loginToken({ email_verified: false })]) {
          const response = await sendWith(login, 'POST', '/api/app/movements/departures', token, departureInput(policy));
          expect(response.status).toBe(401);
        }
        expect(repository.createMovement).not.toHaveBeenCalled();
      });

      it('rejects login tokens where centralLogin is not configured', async () => {
        const response = await sendWith(withoutConfig, 'POST', '/api/app/movements/departures', loginToken(), departureInput(policy));

        expect(response.status).toBe(401);
        expect(repository.createMovement).not.toHaveBeenCalled();
      });
    });

    it('answers 500 when the config lacks the policy fields', async () => {
      const app = express();
      registerMovementRoutes(app, { movementWritesViaApi: true }, {
        auth: fakeAuth, db: fakeDb, repository: fakeRepository(),
      });
      const broken = await listen(app);
      try {
        const response = await broken.request('/api/app/movements/departures', {
          method: 'POST',
          headers: { Authorization: 'Bearer token-pilot-uid', 'Content-Type': 'application/json' },
          body: JSON.stringify(departureInput(policy)),
        });

        expect(response.status).toBe(500);
        expect(logger.error).toHaveBeenCalledWith('API request failed', expect.objectContaining({
          error: expect.stringContaining('Invalid movement policy config'),
        }));
      } finally {
        await broken.close();
      }
    });
  });
});
