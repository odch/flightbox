'use strict';

jest.mock('firebase-functions/v1', () => ({
  config: jest.fn(() => ({}))
}));

const flightnet = require('.');

jest.mock('./flightnet', () => ({
  passwordCheck: jest.fn((company, username, password) => Promise.resolve(password === 't3st'))
}));

describe('functions', () => {
  describe('auth', () => {
    describe('modes', () => {
      describe('flightnet', () => {
        it('should throw a ClientError if `company` is missing in request body', () => {
          const request = {
            body: {
              username: '30001',
              password: 't3st'
            }
          };
          return expect(() => flightnet(request)).toThrow('Required property `company` missing in request body.');
        });

        it('should throw a ClientError if `username` is missing in request body', () => {
          const request = {
            body: {
              company: 'mfgt',
              password: 't3st'
            }
          };
          return expect(() => flightnet(request)).toThrow('Required property `username` missing in request body.');
        });

        it('should throw a ClientError if `password` is missing in request body', () => {
          const request = {
            body: {
              company: 'mfgt',
              username: '30001'
            }
          };
          return expect(() => flightnet(request)).toThrow('Required property `password` missing in request body.');
        });

        it('should return uid "30001" if credentials are valid', () => {
          const request = {
            body: {
              company: 'mfgt',
              username: '30001',
              password: 't3st'
            }
          };
          return expect(flightnet(request)).resolves.toEqual('30001');
        });

        it('should return null if credentials are valid', () => {
          const request = {
            body: {
              company: 'mfgt',
              username: '30001',
              password: 'wrong_pw'
            }
          };
          return expect(flightnet(request)).resolves.toEqual(null);
        });

        describe('with static credentials configured', () => {
          let flightnetWithStatic;
          let mockPasswordCheck;

          beforeEach(() => {
            jest.resetModules();
            mockPasswordCheck = jest.fn();
            jest.doMock('firebase-functions/v1', () => ({
              config: jest.fn(() => ({
                auth: { staticcredentials: 'alice:pw1,bob:pw2' }
              }))
            }));
            jest.doMock('./flightnet', () => ({
              passwordCheck: mockPasswordCheck
            }));
            flightnetWithStatic = require('.');
          });

          it("returns the username when the first static credential matches", () => {
            const request = { body: { username: 'alice', password: 'pw1' } };
            return expect(flightnetWithStatic(request)).resolves.toEqual('alice');
          });

          it("returns the username when the second static credential matches", () => {
            const request = { body: { username: 'bob', password: 'pw2' } };
            return expect(flightnetWithStatic(request)).resolves.toEqual('bob');
          });

          it('returns null when the password is wrong for a known username', () => {
            const request = { body: { username: 'alice', password: 'wrong' } };
            return expect(flightnetWithStatic(request)).resolves.toBeNull();
          });

          it('returns null when the username is unknown', () => {
            const request = { body: { username: 'charlie', password: 'pw1' } };
            return expect(flightnetWithStatic(request)).resolves.toBeNull();
          });

          it('does not call flightnet.passwordCheck when static credentials are set', async () => {
            const request = { body: { username: 'alice', password: 'pw1' } };
            await flightnetWithStatic(request);
            expect(mockPasswordCheck).not.toHaveBeenCalled();
          });
        });
      });
    });
  });
});
