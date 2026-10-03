jest.mock('firebase-admin/database', () => ({ getDatabase: jest.fn() }));
jest.mock('firebase-functions/logger', () => ({ error: jest.fn() }));
jest.mock('./fbAuth', () => ({ fbAdminAuth: jest.fn((req, res, next) => next()) }));

const { fbAdminAuth } = require('./fbAuth');
const { apiKeyOrAdminAuth, credentialsInUrl } = require('./apiKeyAuth');
const { createApiKey, revokeApiKey, DAILY_LIMIT } = require('../apiKeys/store');
const { createMemoryDb } = require('../apiKeys/testing/memoryDb');

const NOW = Date.UTC(2026, 9, 3, 8, 12);

describe('functions', () => {
  describe('api/apiKeyAuth', () => {
    let db;
    let res;
    let next;

    const middleware = scope => apiKeyOrAdminAuth(scope, { db: () => db, now: () => NOW });
    const request = (authorization, query = {}) => ({ headers: authorization ? { authorization } : {}, query });
    const createKey = scopes => createApiKey(db, {
      name: 'Statistikprogramm', scopes, createdBy: { uid: 'u', email: 'admin@example.ch' },
    }, NOW - 1000);

    beforeEach(() => {
      jest.clearAllMocks();
      db = createMemoryDb();
      res = { status: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis(), setHeader: jest.fn() };
      next = jest.fn();
    });

    it('lets a key with the scope through and tells the route which key it is', async () => {
      const { key, apiKey } = await createKey(['reports:airstat']);
      const req = request(`Bearer ${key}`);

      await middleware('reports:airstat')(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.apiKey).toEqual({ id: apiKey.id, name: 'Statistikprogramm', scopes: ['reports:airstat'] });
      expect(fbAdminAuth).not.toHaveBeenCalled();
    });

    it.each(['bearer', 'BEARER', 'Bearer  '])('accepts the scheme spelled %j', async scheme => {
      const { key } = await createKey(['reports:airstat']);

      await middleware('reports:airstat')(request(`${scheme} ${key}`), res, next);

      expect(next).toHaveBeenCalled();
      expect(fbAdminAuth).not.toHaveBeenCalled();
    });

    it('answers 403 for a key without the scope', async () => {
      const { key } = await createKey(['reports:other']);

      await middleware('reports:airstat')(request(`Bearer ${key}`), res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith({ error: 'insufficient_scope', scope: 'reports:airstat' });
      expect(next).not.toHaveBeenCalled();
    });

    it('answers 401 for an unknown or revoked key', async () => {
      const { key, apiKey } = await createKey(['reports:airstat']);
      await revokeApiKey(db, apiKey.id);

      await middleware('reports:airstat')(request(`Bearer ${key}`), res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({ error: 'invalid_api_key' });
      expect(res.setHeader).toHaveBeenCalledWith('WWW-Authenticate', 'Bearer error="invalid_token"');
      expect(next).not.toHaveBeenCalled();
    });

    it('answers 429 with Retry-After when the daily limit is used up', async () => {
      const { key } = await createKey(['reports:airstat']);
      for (let i = 0; i < DAILY_LIMIT; i++) {
        await middleware('reports:airstat')(request(`Bearer ${key}`), res, next);
      }
      expect(next).toHaveBeenCalledTimes(DAILY_LIMIT);

      await middleware('reports:airstat')(request(`Bearer ${key}`), res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.setHeader).toHaveBeenCalledWith('Retry-After', String((Date.UTC(2026, 9, 4) - NOW) / 1000));
      expect(next).toHaveBeenCalledTimes(DAILY_LIMIT);
    });

    it('hands other bearer tokens to the admin check', async () => {
      const req = request('Bearer eyJhbGciOi.firebase.idtoken');

      await middleware('reports:airstat')(req, res, next);

      expect(fbAdminAuth).toHaveBeenCalledWith(req, res, next);
    });

    it('rejects a key in the query string, and leaves it valid', async () => {
      const { key } = await createKey(['reports:airstat']);

      await middleware('reports:airstat')(request(undefined, { year: '2026', key }), res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ error: 'credentials_in_url' }));

      await middleware('reports:airstat')(request(`Bearer ${key}`), res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('answers 500 when the key cannot be checked', async () => {
      const { key } = await createKey(['reports:airstat']);
      db = { ref: () => ({ transaction: () => Promise.reject(new Error('unavailable')) }) };

      await middleware('reports:airstat')(request(`Bearer ${key}`), res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });

    describe('credentialsInUrl', () => {
      it.each([
        [{ apikey: 'x' }, true],
        [{ Access_Token: 'x' }, true],
        [{ year: 'fbx_abc' }, true],
        [{ month: ['9', 'fbx_abc'] }, true],
        [{ year: '2026', fbx_abc: '' }, true],
        [{ year: ' fbx_abc' }, true],
        [{ year: '2026', month: '9', internal: 'true' }, false],
        [{}, false],
        [undefined, false],
      ])('%j -> %s', (query, expected) => {
        expect(credentialsInUrl(query)).toBe(expected);
      });
    });
  });
});
