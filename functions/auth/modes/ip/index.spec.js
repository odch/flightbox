'use strict';

const ip = require('.');

jest.mock('firebase-functions', () => ({
  config: jest.fn().mockReturnValue({
    auth: {
      ips: '10.27.3.18,10.27.3.19'
    }
  })
}));

const request = ip => ({
  headers: {
    'x-forwarded-for': ip
  }
});

describe('functions', () => {
  describe('auth', () => {
    describe('modes', () => {
      describe('ip', () => {
        it('should return uid "ipauth" if is allowed IP', () => {
          return expect(ip(request('10.27.3.18'))).resolves.toEqual('ipauth');
        });

        it('should return null if is forbidden IP', () => {
          return expect(ip(request('10.27.4.20'))).resolves.toEqual(null);
        });
      });
    });
  });
});
