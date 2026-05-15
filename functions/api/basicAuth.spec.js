'use strict';

// basicAuth.js captures process.env at require time, so each describe
// block resets modules and requires the module with the relevant env.

const makeReq = (authHeader) => ({
  headers: { authorization: authHeader || '' },
});

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

describe('functions/api/basicAuth', () => {
  let consoleInfoSpy;

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    delete process.env.API_SERVICEUSER_USERNAME;
    delete process.env.API_SERVICEUSER_PASSWORD;
  });

  describe('when env vars are missing', () => {
    let basicAuth;

    beforeEach(() => {
      jest.resetModules();
      basicAuth = require('./basicAuth');
    });

    it('returns 401 when both env vars are absent', () => {
      const next = jest.fn();
      const res = makeRes();
      basicAuth(makeReq(), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Unauthorized');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('when username is missing', () => {
    let basicAuth;

    beforeEach(() => {
      jest.resetModules();
      process.env.API_SERVICEUSER_PASSWORD = 'pass';
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

  describe('when password is missing', () => {
    let basicAuth;

    beforeEach(() => {
      jest.resetModules();
      process.env.API_SERVICEUSER_USERNAME = 'user';
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

  describe('with valid env vars', () => {
    let basicAuth;

    beforeEach(() => {
      jest.resetModules();
      process.env.API_SERVICEUSER_USERNAME = 'admin';
      process.env.API_SERVICEUSER_PASSWORD = 's3cret';
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
