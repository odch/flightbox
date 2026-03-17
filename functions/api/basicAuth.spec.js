'use strict';

// basicAuth.js captures functions.config() at require time, so each describe
// block resets modules and requires the module with the relevant config.

const makeReq = (authHeader) => ({
  headers: { authorization: authHeader || '' },
});

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

describe('functions/api/basicAuth', () => {
  describe('when config is missing', () => {
    let basicAuth;

    beforeEach(() => {
      jest.resetModules();
      jest.mock('firebase-functions', () => ({
        config: jest.fn(() => ({})),
      }));
      basicAuth = require('./basicAuth');
    });

    it('returns 401 when api config is absent', () => {
      const next = jest.fn();
      const res = makeRes();
      basicAuth(makeReq(), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when config is missing username', () => {
    let basicAuth;

    beforeEach(() => {
      jest.resetModules();
      jest.mock('firebase-functions', () => ({
        config: jest.fn(() => ({ api: { serviceuser: { password: 'pass' } } })),
      }));
      basicAuth = require('./basicAuth');
    });

    it('returns 401', () => {
      const next = jest.fn();
      const res = makeRes();
      basicAuth(makeReq(), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when config is missing password', () => {
    let basicAuth;

    beforeEach(() => {
      jest.resetModules();
      jest.mock('firebase-functions', () => ({
        config: jest.fn(() => ({ api: { serviceuser: { username: 'user' } } })),
      }));
      basicAuth = require('./basicAuth');
    });

    it('returns 401', () => {
      const next = jest.fn();
      const res = makeRes();
      basicAuth(makeReq(), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('with valid config', () => {
    let basicAuth;

    beforeEach(() => {
      jest.resetModules();
      jest.mock('firebase-functions', () => ({
        config: jest.fn(() => ({
          api: { serviceuser: { username: 'admin', password: 's3cret' } },
        })),
      }));
      basicAuth = require('./basicAuth');
    });

    it('calls next() when credentials are valid', () => {
      const next = jest.fn();
      const res = makeRes();
      const credentials = Buffer.from('admin:s3cret').toString('base64');
      basicAuth(makeReq(`Basic ${credentials}`), res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('returns 401 when password is wrong', () => {
      const next = jest.fn();
      const res = makeRes();
      const credentials = Buffer.from('admin:wrongpass').toString('base64');
      basicAuth(makeReq(`Basic ${credentials}`), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when username is wrong', () => {
      const next = jest.fn();
      const res = makeRes();
      const credentials = Buffer.from('wronguser:s3cret').toString('base64');
      basicAuth(makeReq(`Basic ${credentials}`), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when no Authorization header is provided', () => {
      const next = jest.fn();
      const res = makeRes();
      basicAuth(makeReq(''), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when auth type is Bearer instead of Basic', () => {
      const next = jest.fn();
      const res = makeRes();
      basicAuth(makeReq('Bearer sometoken'), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
