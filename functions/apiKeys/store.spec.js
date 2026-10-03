'use strict';

const { createApiKey, listApiKeys, revokeApiKey, useApiKey, DAILY_LIMIT } = require('./store');
const { parseKey, hashSecret } = require('./keys');
const { createMemoryDb } = require('./testing/memoryDb');

const NOW = Date.UTC(2026, 9, 3, 8, 12);
const DAY = 24 * 60 * 60 * 1000;
const ADMIN = { uid: 'admin-uid', email: 'admin@example.ch' };

const create = (db, fields = {}) => createApiKey(db, {
  name: 'Statistikprogramm', scopes: ['reports:airstat'], expiresAt: null, createdBy: ADMIN, ...fields,
}, NOW);

describe('functions', () => {
  describe('apiKeys/store', () => {
    let db;

    beforeEach(() => {
      db = createMemoryDb();
    });

    describe('createApiKey', () => {
      it('stores only the hash and returns the plaintext key once', async () => {
        const { key, apiKey } = await create(db, { expiresAt: NOW + DAY });
        const { id, secret } = parseKey(key);

        expect(apiKey).toEqual({
          id, name: 'Statistikprogramm', scopes: ['reports:airstat'], createdAt: NOW,
          createdBy: 'admin@example.ch', expiresAt: NOW + DAY, lastUsedAt: null,
        });
        const stored = db.read(`/apiKeys/${id}`);
        expect(stored.hash).toBe(hashSecret(secret));
        expect(JSON.stringify(stored)).not.toContain(secret);
        expect(stored.createdBy).toEqual(ADMIN);
      });

      it('creates a different key every time', async () => {
        const first = await create(db);
        const second = await create(db);
        expect(first.key).not.toBe(second.key);
        expect(first.apiKey.id).not.toBe(second.apiKey.id);
      });
    });

    describe('listApiKeys', () => {
      it('lists the keys newest first, without hashes', async () => {
        const older = await createApiKey(db, { name: 'A', scopes: ['reports:airstat'], createdBy: ADMIN }, NOW - DAY);
        const newer = await create(db, { name: 'B' });

        const keys = await listApiKeys(db);

        expect(keys.map(key => key.name)).toEqual(['B', 'A']);
        expect(keys[0]).toEqual(newer.apiKey);
        expect(keys[1]).toEqual(older.apiKey);
        expect(JSON.stringify(keys)).not.toContain('hash');
      });

      it('returns an empty list without keys', async () => {
        expect(await listApiKeys(db)).toEqual([]);
      });
    });

    describe('useApiKey', () => {
      it('accepts a valid key and records its use', async () => {
        const { key, apiKey } = await create(db, { scopes: ['reports:airstat', 'reports:airstat:internal'] });

        expect(await useApiKey(db, key, NOW + 1000)).toEqual({
          apiKey: { id: apiKey.id, name: 'Statistikprogramm', scopes: ['reports:airstat', 'reports:airstat:internal'] },
        });
        expect(db.read(`/apiKeys/${apiKey.id}`)).toMatchObject({
          lastUsedAt: NOW + 1000, usage: { day: '2026-10-03', count: 1 },
        });
      });

      it.each([
        ['a malformed key', 'fbx_short'],
        ['a key with a wrong secret', null],
        ['an unknown key', 'fbx_AAAAAAAAAAAA_' + 'A'.repeat(43)],
      ])('rejects %s', async (name, presented) => {
        const { key } = await create(db);
        const wrong = presented || key.slice(0, -1) + (key.endsWith('A') ? 'B' : 'A');

        expect(await useApiKey(db, wrong, NOW)).toEqual({ error: 'invalid_api_key' });
      });

      it('rejects a revoked key without bringing it back', async () => {
        const { key, apiKey } = await create(db);
        await revokeApiKey(db, apiKey.id);

        expect(await useApiKey(db, key, NOW)).toEqual({ error: 'invalid_api_key' });
        expect(db.read(`/apiKeys/${apiKey.id}`)).toBe(null);
      });

      it('rejects a key revoked while it is being checked', async () => {
        const { key } = await create(db);
        // The Admin SDK aborts a running transaction when its path is written.
        const aborting = error => ({ ref: () => ({ transaction: () => Promise.reject(error) }) });

        expect(await useApiKey(aborting(new Error('set')), key, NOW)).toEqual({ error: 'invalid_api_key' });
        await expect(useApiKey(aborting(new Error('disconnect')), key, NOW)).rejects.toThrow('disconnect');
      });

      it('rejects an expired key, also at the exact expiry', async () => {
        const { key } = await create(db, { expiresAt: NOW + DAY });

        expect((await useApiKey(db, key, NOW + DAY - 1)).apiKey).toBeDefined();
        expect(await useApiKey(db, key, NOW + DAY)).toEqual({ error: 'key_expired' });
      });

      it(`allows ${DAILY_LIMIT} requests per UTC day`, async () => {
        const { key, apiKey } = await create(db);
        for (let i = 0; i < DAILY_LIMIT; i++) {
          expect((await useApiKey(db, key, NOW)).apiKey).toBeDefined();
        }

        const limited = await useApiKey(db, key, NOW);
        expect(limited).toEqual({ error: 'rate_limited', retryAfterSeconds: (Date.UTC(2026, 9, 4) - NOW) / 1000 });
        expect(db.read(`/apiKeys/${apiKey.id}`).usage).toEqual({ day: '2026-10-03', count: DAILY_LIMIT });

        expect((await useApiKey(db, key, Date.UTC(2026, 9, 4))).apiKey).toBeDefined();
        expect(db.read(`/apiKeys/${apiKey.id}`).usage).toEqual({ day: '2026-10-04', count: 1 });
      });
    });

    describe('revokeApiKey', () => {
      it('removes the key and ignores unknown or malformed ids', async () => {
        const { apiKey } = await create(db);
        await revokeApiKey(db, 'not an id');
        await revokeApiKey(db, '../settings');
        expect(await listApiKeys(db)).toHaveLength(1);

        await revokeApiKey(db, apiKey.id);
        await revokeApiKey(db, apiKey.id);
        expect(await listApiKeys(db)).toEqual([]);
      });
    });
  });
});
