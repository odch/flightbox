'use strict';

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
      });
    });
  });
});
