'use strict';

const auth = require('.');

jest.mock('cors', () => () => (req, res, delegate) => delegate());

jest.mock('firebase-functions', () => ({
  config: jest.fn().mockReturnValue({
    serviceaccount: {
      clientemail: 'foo@firebase.google.com',
      privatekey: '"testprivatekey"'
    }
  }),
  https: {
    onRequest: jest.fn(callback => callback)
  }
}));

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  auth: jest.fn().mockReturnValue({
    createCustomToken: jest.fn((uid, additionalClaims) => Promise.resolve('token-' + uid))
  })
}));

jest.mock('./modes', () => ({
  ip: jest.fn(req => Promise.resolve(req.headers['x-forwarded-for'] === '10.27.3.18' ? 'ipauth' : null)),
  flightnet: jest.fn(req =>
    Promise.resolve(req.body.username === '30001' && req.body.password === 't3st' ? '30001' : null)
  )
}));

describe('functions', () => {
  describe('auth', () => {
    it('should return status 405 if not called with POST', () => {
      const req = {
        method: 'GET'
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
      };

      auth(req, res);

      expect(res.status).toBeCalledWith(405);
    });

    it('should return token for IP auth', () => {
      const req = {
        method: 'POST',
        headers: {
          'x-forwarded-for': '10.27.3.18'
        },
        body: {
          mode: 'ip'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
      };

      return auth(req, res).then(() => {
        expect(res.send).toBeCalledWith({
          token: 'token-ipauth'
        })
      });
    });

    it('should return token for flightnet auth', () => {
      const req = {
        method: 'POST',
        headers: {
          'x-forwarded-for': '10.27.3.18'
        },
        body: {
          mode: 'flightnet',
          username: '30001',
          password: 't3st'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
      };

      return auth(req, res).then(() => {
        expect(res.send).toBeCalledWith({
          token: 'token-30001'
        })
      });
    });
  });
});
