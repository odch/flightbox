'use strict';

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

        afterEach(() => {
          delete process.env.AUTH_STATIC_CREDENTIALS;
        });

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
      });
    });
  });
});
