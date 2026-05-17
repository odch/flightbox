'use strict';

const TEST_EMAIL = 'cypress-pilot@example.com';

describe('functions/auth/createTestEmailToken', () => {
  let mockGetUserByEmail;
  let mockCreateUser;
  let mockCreateCustomToken;
  let handler;
  let consoleErrorSpy;

  const makeReq = (overrides = {}) => ({ method: 'POST', ...overrides });
  const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  beforeEach(() => {
    jest.resetModules();

    mockGetUserByEmail = jest.fn();
    mockCreateUser = jest.fn();
    mockCreateCustomToken = jest.fn();

    jest.doMock('firebase-functions/v1', () => ({
      region: () => ({
        https: { onRequest: fn => fn },
      }),
    }));

    jest.doMock('firebase-admin', () => ({
      auth: () => ({
        getUserByEmail: mockGetUserByEmail,
        createUser: mockCreateUser,
        createCustomToken: mockCreateCustomToken,
      }),
    }));

    jest.doMock('cors', () => () => (req, res, cb) => Promise.resolve(cb()));

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    handler = require('./createTestEmailToken').createTestEmailToken;
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    delete process.env.TESTING_ENABLED;
  });

  describe('when testing is not enabled', () => {
    it('returns 403 when TESTING_ENABLED is unset', async () => {
      const res = makeRes();
      await handler(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Testing endpoints are not enabled' });
    });

    it('returns 403 when TESTING_ENABLED is "false"', async () => {
      process.env.TESTING_ENABLED = 'false';
      const res = makeRes();
      await handler(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('when testing is enabled', () => {
    beforeEach(() => {
      process.env.TESTING_ENABLED = 'true';
    });

    it('returns 405 when method is not POST', async () => {
      const res = makeRes();
      await handler(makeReq({ method: 'GET' }), res);
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('returns 200 with token when user already exists', async () => {
      mockGetUserByEmail.mockResolvedValue({ uid: 'existing-uid' });
      mockCreateCustomToken.mockResolvedValue('tok');
      const res = makeRes();
      await handler(makeReq(), res);
      expect(mockGetUserByEmail).toHaveBeenCalledWith(TEST_EMAIL);
      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(mockCreateCustomToken).toHaveBeenCalledWith('existing-uid', { email: TEST_EMAIL });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: 'tok' });
    });

    it('creates the user and returns 200 with token when user does not exist', async () => {
      const notFound = Object.assign(new Error('not found'), { code: 'auth/user-not-found' });
      mockGetUserByEmail.mockRejectedValue(notFound);
      mockCreateUser.mockResolvedValue({ uid: 'new-uid' });
      mockCreateCustomToken.mockResolvedValue('tok');
      const res = makeRes();
      await handler(makeReq(), res);
      expect(mockCreateUser).toHaveBeenCalledWith({ email: TEST_EMAIL });
      expect(mockCreateCustomToken).toHaveBeenCalledWith('new-uid', { email: TEST_EMAIL });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: 'tok' });
    });

    it('returns 500 when getUserByEmail rejects with a non-not-found error', async () => {
      mockGetUserByEmail.mockRejectedValue(new Error('boom'));
      const res = makeRes();
      await handler(makeReq(), res);
      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create test email token' });
    });

    it('returns 500 when createCustomToken rejects', async () => {
      mockGetUserByEmail.mockResolvedValue({ uid: 'u' });
      mockCreateCustomToken.mockRejectedValue(new Error('token kaboom'));
      const res = makeRes();
      await handler(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
