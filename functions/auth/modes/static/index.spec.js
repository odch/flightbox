'use strict';

const crypto = require('crypto');

// In-memory RTDB stub shared by all requires of the module under test.
let mockStore = {};
const mockDatabase = {
  ref: (path) => ({
    once: () => Promise.resolve({ val: () => (path in mockStore ? mockStore[path] : null) }),
    remove: () => { delete mockStore[path]; return Promise.resolve(); },
    transaction: (fn) => {
      const next = fn(path in mockStore ? mockStore[path] : null);
      if (next !== undefined) {
        mockStore[path] = next;
      }
      return Promise.resolve({ committed: next !== undefined });
    },
  }),
};

const mockLogger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() };

jest.mock('firebase-admin', () => ({ database: () => mockDatabase }));
jest.mock('firebase-functions/v2', () => ({ logger: mockLogger }));

const WINDOW_MS = 15 * 60 * 1000;
const keyPath = (ip) => '/staticAuthRateLimits/' + crypto.createHash('sha256').update(ip).digest('hex');

describe('functions', () => {
  describe('auth', () => {
    describe('modes', () => {
      describe('static', () => {
        const loadStatic = (credentials) => {
          jest.resetModules();
          if (credentials) {
            process.env.AUTH_STATIC_CREDENTIALS = credentials;
          } else {
            delete process.env.AUTH_STATIC_CREDENTIALS;
          }
          return require('.');
        };

        const reqWithIp = (username, password, ip = '203.0.113.7') => ({
          body: { username, password },
          headers: { 'x-forwarded-for': ip },
        });

        beforeEach(() => {
          mockStore = {};
          jest.clearAllMocks();
        });

        afterEach(() => {
          delete process.env.AUTH_STATIC_CREDENTIALS;
        });

        // --- existing behaviour (no IP -> throttle skipped) ---

        it('should throw a ClientError if `username` is missing in request body', () => {
          const staticMode = loadStatic('alice:pw1');
          const request = { body: { password: 'pw1' } };
          return expect(() => staticMode(request)).toThrow('Required property `username` missing in request body.');
        });

        it('should throw a ClientError if `password` is missing in request body', () => {
          const staticMode = loadStatic('alice:pw1');
          const request = { body: { username: 'alice' } };
          return expect(() => staticMode(request)).toThrow('Required property `password` missing in request body.');
        });

        it('returns the username when the first static credential matches', () => {
          const staticMode = loadStatic('alice:pw1,bob:pw2');
          const request = { body: { username: 'alice', password: 'pw1' } };
          return expect(staticMode(request)).resolves.toEqual('alice');
        });

        it('returns the username when the second static credential matches', () => {
          const staticMode = loadStatic('alice:pw1,bob:pw2');
          const request = { body: { username: 'bob', password: 'pw2' } };
          return expect(staticMode(request)).resolves.toEqual('bob');
        });

        it('returns null when the password is wrong for a known username', () => {
          const staticMode = loadStatic('alice:pw1,bob:pw2');
          const request = { body: { username: 'alice', password: 'wrong' } };
          return expect(staticMode(request)).resolves.toBeNull();
        });

        it('returns null when the username is unknown', () => {
          const staticMode = loadStatic('alice:pw1,bob:pw2');
          const request = { body: { username: 'charlie', password: 'pw1' } };
          return expect(staticMode(request)).resolves.toBeNull();
        });

        it('returns null when no static credentials are configured', () => {
          const staticMode = loadStatic(null);
          const request = { body: { username: 'alice', password: 'pw1' } };
          return expect(staticMode(request)).resolves.toBeNull();
        });

        // --- per-IP throttle ---

        it('blocks further attempts from an IP after MAX_FAILURES failures', async () => {
          const staticMode = loadStatic('alice:pw1');
          for (let i = 0; i < 10; i++) {
            expect(await staticMode(reqWithIp('alice', 'wrong'))).toBeNull();
          }
          // 11th attempt is rejected even with the CORRECT password.
          expect(await staticMode(reqWithIp('alice', 'pw1'))).toBeNull();
          expect(mockLogger.warn).toHaveBeenCalled();
        });

        it('does not block a different IP', async () => {
          const staticMode = loadStatic('alice:pw1');
          for (let i = 0; i < 10; i++) {
            await staticMode(reqWithIp('alice', 'wrong', '203.0.113.7'));
          }
          expect(await staticMode(reqWithIp('alice', 'pw1', '198.51.100.9'))).toEqual('alice');
        });

        it('a successful login clears the failure counter', async () => {
          const staticMode = loadStatic('alice:pw1');
          for (let i = 0; i < 3; i++) {
            await staticMode(reqWithIp('alice', 'wrong'));
          }
          expect(await staticMode(reqWithIp('alice', 'pw1'))).toEqual('alice');
          expect(mockStore[keyPath('203.0.113.7')]).toBeUndefined();
        });

        it('auto-recovers once the window has elapsed', async () => {
          const staticMode = loadStatic('alice:pw1');
          // Seed a maxed-out counter whose window started more than WINDOW_MS ago.
          mockStore[keyPath('203.0.113.7')] = { windowStart: Date.now() - (WINDOW_MS + 1000), count: 10 };
          expect(await staticMode(reqWithIp('alice', 'pw1'))).toEqual('alice');
        });

        it('does not touch the limiter when the request has no IP', async () => {
          const staticMode = loadStatic('alice:pw1');
          expect(await staticMode({ body: { username: 'alice', password: 'pw1' } })).toEqual('alice');
          expect(Object.keys(mockStore)).toHaveLength(0);
        });
      });
    });
  });
});
