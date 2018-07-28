'use strict';

const requestHelper = require('./requestHelper');

describe('functions', () => {
  describe('auth', () => {
    describe('util', () => {
      describe('requestHelper', () => {
        describe('requireBodyProperty', () => {
          it('should return the body property', () => {
            const request = {
              body: {
                foo: 'bar'
              }
            };
            expect(requestHelper.requireBodyProperty(request, 'foo')).toEqual('bar');
          });

          it('should throw a ClientError if the body property is missing', () => {
            const request = {
              body: {
              }
            };
            expect(() => requestHelper.requireBodyProperty(request, 'foo'))
              .toThrow('Required property `foo` missing in request body.');
          });
        });

        describe('getIp', () => {
          it('should return x-forwarded-for` header if set', () => {
            const request = {
              headers: {
                'x-forwarded-for': '10.27.1.4'
              },
              connection: {
                remoteAddress: '10.27.1.5'
              }
            };
            expect(requestHelper.getIp(request)).toEqual('10.27.1.4');
          });

          it('should return remoteAddress from connection as fallback', () => {
            const request = {
              headers: {},
              connection: {
                remoteAddress: '10.27.1.5'
              }
            };
            expect(requestHelper.getIp(request)).toEqual('10.27.1.5');
          });

          it('should return the first IP from the x-forwarded-for` header', () => {
            const request = {
              headers: {
                'x-forwarded-for': '10.27.1.4, 10.27.1.4'
              },
              connection: {
                remoteAddress: '10.27.1.5'
              }
            };
            expect(requestHelper.getIp(request)).toEqual('10.27.1.4');
          });

          it('should return the first IP from remoteAddress', () => {
            const request = {
              headers: {
              },
              connection: {
                remoteAddress: '10.27.1.4, 10.27.1.4'
              }
            };
            expect(requestHelper.getIp(request)).toEqual('10.27.1.4');
          });

          it('should return null if no IP address is set', () => {
            const request = {
              headers: {
              },
              connection: {
              }
            };
            expect(requestHelper.getIp(request)).toEqual(null)
          });
        });
      });
    });
  });
});
