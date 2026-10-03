jest.mock('firebase-admin/database', () => ({ getDatabase: jest.fn() }));
jest.mock('firebase-functions/logger', () => ({ info: jest.fn(), error: jest.fn() }));

const { PATHS, ID_PATHS, addMonths, parseCreateRequest, registerApiKeyRoutes } = require('./apiKeys');
const { parseKey } = require('../apiKeys/keys');
const { createMemoryDb } = require('../apiKeys/testing/memoryDb');

const AVAILABLE = ['reports:airstat', 'reports:airstat:internal'];
const NOW = Date.UTC(2026, 9, 3, 8, 12);

describe('functions', () => {
  describe('api/apiKeys', () => {
    describe('addMonths', () => {
      it.each([
        [Date.UTC(2026, 9, 3, 8, 12), 12, Date.UTC(2027, 9, 3, 8, 12)],
        [Date.UTC(2026, 7, 31, 10), 6, Date.UTC(2027, 1, 28, 10)],
        [Date.UTC(2026, 10, 30, 10), 3, Date.UTC(2027, 1, 28, 10)],
        [Date.UTC(2026, 11, 31, 10), 6, Date.UTC(2027, 5, 30, 10)],
        [Date.UTC(2028, 1, 29, 10), 12, Date.UTC(2029, 1, 28, 10)],
        [Date.UTC(2026, 0, 31, 10), 24, Date.UTC(2028, 0, 31, 10)],
      ])('%d + %d months -> %d', (start, months, expected) => {
        expect(new Date(addMonths(start, months)).toISOString()).toBe(new Date(expected).toISOString());
      });
    });

    describe('parseCreateRequest', () => {
      const valid = { name: ' Statistikprogramm ', scopes: ['reports:airstat'], expiresInMonths: 12 };

      it('accepts a valid request and trims the name', () => {
        expect(parseCreateRequest(valid, AVAILABLE))
          .toEqual({ name: 'Statistikprogramm', scopes: ['reports:airstat'], expiresInMonths: 12 });
        expect(parseCreateRequest({ ...valid, expiresInMonths: null }, AVAILABLE).expiresInMonths).toBe(null);
        expect(parseCreateRequest({
          ...valid, scopes: ['reports:airstat', 'reports:airstat:internal'], confirmPersonalData: true,
        }, AVAILABLE).scopes).toHaveLength(2);
      });

      it.each([
        [{ ...valid, name: '  ' }, 'name'],
        [{ ...valid, name: 'x'.repeat(61) }, 'name'],
        [{ ...valid, name: 42 }, 'name'],
        [{ ...valid, scopes: [] }, 'scopes'],
        [{ ...valid, scopes: ['reports:other'] }, 'scopes'],
        [{ ...valid, scopes: ['reports:airstat', 'reports:airstat'] }, 'scopes'],
        [{ ...valid, scopes: 'reports:airstat' }, 'scopes'],
        [{ ...valid, scopes: ['reports:airstat:internal'], confirmPersonalData: true }, 'scopes'],
        [{ ...valid, scopes: ['reports:airstat', 'reports:airstat:internal'] }, 'confirmPersonalData'],
        [{ ...valid, expiresInMonths: 1 }, 'expiresInMonths'],
        [{ ...valid, expiresInMonths: undefined }, 'expiresInMonths'],
        [{ ...valid, expiresInMonths: '12' }, 'expiresInMonths'],
        [undefined, 'name'],
      ])('rejects %j', (body, field) => {
        let error;
        try {
          parseCreateRequest(body, AVAILABLE);
        } catch (e) {
          error = e;
        }
        expect(error.field).toBe(field);
      });

      it('rejects scopes the tenant does not offer', () => {
        expect(() => parseCreateRequest(valid, [])).toThrow('scopes');
      });
    });

    describe('routes', () => {
      let db;
      let routes;
      const auth = jest.fn();
      const response = () => ({ status: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis(), setHeader: jest.fn() });
      const admin = extra => ({ fbUserId: 'admin-uid', fbUserEmail: 'admin@example.ch', ...extra });

      beforeEach(() => {
        db = createMemoryDb();
        routes = {};
        const app = { get: jest.fn(), post: jest.fn(), delete: jest.fn() };
        registerApiKeyRoutes(app, { availableScopes: AVAILABLE, auth, db: () => db, now: () => NOW });
        ['get', 'post', 'delete'].forEach(method => {
          const [paths, middleware, handler] = app[method].mock.calls[0];
          routes[method] = { paths, middleware, handler };
        });
      });

      it('protects every route with the given admin auth', () => {
        expect(routes.get).toMatchObject({ paths: PATHS, middleware: auth });
        expect(routes.post).toMatchObject({ paths: PATHS, middleware: auth });
        expect(routes.delete).toMatchObject({ paths: ID_PATHS, middleware: auth });
        expect(ID_PATHS).toEqual(['/v1/api-keys/:id', '/api/v1/api-keys/:id']);
      });

      it('creates a key, lists it without the secret and revokes it', async () => {
        const createRes = response();
        await routes.post.handler(admin({
          body: { name: 'Statistikprogramm', scopes: ['reports:airstat'], expiresInMonths: 12 },
        }), createRes);

        expect(createRes.status).toHaveBeenCalledWith(201);
        expect(createRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
        const { key, apiKey } = createRes.send.mock.calls[0][0];
        expect(parseKey(key).id).toBe(apiKey.id);
        expect(apiKey).toEqual({
          id: apiKey.id, name: 'Statistikprogramm', scopes: ['reports:airstat'], createdAt: NOW,
          createdBy: 'admin@example.ch', expiresAt: Date.UTC(2027, 9, 3, 8, 12), lastUsedAt: null,
        });

        const listRes = response();
        await routes.get.handler(admin(), listRes);
        expect(listRes.status).toHaveBeenCalledWith(200);
        expect(listRes.send).toHaveBeenCalledWith({ availableScopes: AVAILABLE, keys: [apiKey] });
        expect(JSON.stringify(listRes.send.mock.calls[0][0])).not.toContain(parseKey(key).secret);

        const revokeRes = response();
        await routes.delete.handler(admin({ params: { id: apiKey.id } }), revokeRes);
        expect(revokeRes.status).toHaveBeenCalledWith(204);
        expect(db.read('/apiKeys')).toBe(null);
      });

      it('creates a key without expiry', async () => {
        const res = response();
        await routes.post.handler(admin({
          body: { name: 'Unbegrenzt', scopes: ['reports:airstat'], expiresInMonths: null },
        }), res);
        expect(res.send.mock.calls[0][0].apiKey.expiresAt).toBe(null);
      });

      it('answers 400 for an invalid request without storing anything', async () => {
        const res = response();
        await routes.post.handler(admin({
          body: { name: 'x', scopes: ['reports:airstat', 'reports:airstat:internal'], expiresInMonths: 12 },
        }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          error: 'invalid_request', field: 'confirmPersonalData',
        }));
        expect(db.read('/apiKeys')).toBe(null);
      });

      it('answers 204 when revoking a key that does not exist', async () => {
        const res = response();
        await routes.delete.handler(admin({ params: { id: 'AAAAAAAAAAAA' } }), res);
        expect(res.status).toHaveBeenCalledWith(204);
      });

      it('answers 500 when the database fails', async () => {
        db = { ref: () => ({ once: () => Promise.reject(new Error('unavailable')) }) };
        const res = response();
        await routes.get.handler(admin(), res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: 'internal_error' });
      });
    });
  });
});
