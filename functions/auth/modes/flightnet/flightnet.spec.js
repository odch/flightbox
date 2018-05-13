'use strict';

const flightnet = require('./flightnet');

jest.mock('soap', () => {
  const client = {
    GetAPIKey: jest.fn((args, callback) => callback(null, {
      GetAPIKeyResult: args.password === 't3st'
    }))
  };
  return {
    createClient: jest.fn((url, callback) => callback(null, client))
  }
});

describe('functions', () => {
  describe('auth', () => {
    describe('modes', () => {
      describe('flightnet', () => {
        describe('flightnet', () => {
          it('should return true if the credentials are valid', () => {
            return expect(flightnet.passwordCheck('mfgt', '30001', 't3st')).resolves.toEqual(true);
          });

          it('should return false if the credentials are invalid', () => {
            return expect(flightnet.passwordCheck('mfgt', '30001', 'wrong_pw')).resolves.toEqual(false);
          });
        });
      });
    });
  });
});
