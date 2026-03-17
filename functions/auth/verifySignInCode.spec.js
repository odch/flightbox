const crypto = require('crypto');

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

describe('functions', () => {
  describe('auth/verifySignInCode', () => {
    let mockAdmin;
    let mockFunctions;
    let capturedHandler;
    let mockCors;
    let mockCodesRef;
    let mockAuthAdmin;

    const now = Date.now();
    const futureExpiry = now + 10 * 60 * 1000;

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;

      mockCors = jest.fn().mockImplementation((req, res, cb) => cb());

      mockFunctions = {
        https: {
          onRequest: jest.fn().mockImplementation(handler => { capturedHandler = handler; })
        }
      };
      mockFunctions.region = jest.fn(() => mockFunctions);

      mockCodesRef = {
        orderByChild: jest.fn().mockReturnThis(),
        equalTo: jest.fn().mockReturnThis(),
        once: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
        child: jest.fn().mockReturnThis(),
        remove: jest.fn().mockResolvedValue(undefined),
      };

      mockAuthAdmin = {
        getUserByEmail: jest.fn(),
        createUser: jest.fn(),
        createCustomToken: jest.fn().mockResolvedValue('custom-token-xyz'),
      };

      mockAdmin = {
        database: jest.fn().mockReturnValue({
          ref: jest.fn().mockReturnValue(mockCodesRef)
        }),
        auth: jest.fn().mockReturnValue(mockAuthAdmin),
      };

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('firebase-functions', () => mockFunctions);
      jest.mock('cors', () => () => mockCors);

      require('./verifySignInCode');
    });

    const makeReq = (method, body) => ({ method, body });
    const makeRes = () => ({
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    });

    const makeSnapshot = (entries) => {
      const exists = entries.length > 0;
      return {
        exists: () => exists,
        forEach: (cb) => entries.forEach(({ key, val }) => cb({ key, val: () => val })),
      };
    };

    it('returns 405 for GET request', async () => {
      const req = makeReq('GET', {});
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 400 when email is missing', async () => {
      const req = makeReq('POST', { code: '123456' });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and code are required' });
    });

    it('returns 400 when code is missing', async () => {
      const req = makeReq('POST', { email: 'user@example.com' });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and code are required' });
    });

    it('returns 400 when no codes exist for email', async () => {
      mockCodesRef.once.mockResolvedValue(makeSnapshot([]));

      const req = makeReq('POST', { email: 'user@example.com', code: '123456' });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired code' });
    });

    it('returns 400 for wrong code and increments attempts', async () => {
      const correctCode = '111111';
      const snapshot = makeSnapshot([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(correctCode), expiry: futureExpiry, attempts: 0 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);

      const req = makeReq('POST', { email: 'user@example.com', code: '999999' });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired code' });
      expect(mockCodesRef.update).toHaveBeenCalledWith({ 'k1/attempts': 1 });
    });

    it('returns 400 for expired code without incrementing attempts', async () => {
      const code = '123456';
      const snapshot = makeSnapshot([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: now - 1000, attempts: 0 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);

      const req = makeReq('POST', { email: 'user@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockCodesRef.update).not.toHaveBeenCalled();
    });

    it('returns 400 for exhausted code (max attempts reached)', async () => {
      const code = '123456';
      const snapshot = makeSnapshot([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 5 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);

      const req = makeReq('POST', { email: 'user@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockCodesRef.update).not.toHaveBeenCalled();
    });

    it('returns 200 with token on valid code and deletes used code', async () => {
      const code = '123456';
      const snapshot = makeSnapshot([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 0 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);
      mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'user-uid-123' });

      const req = makeReq('POST', { email: 'user@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(mockCodesRef.child).toHaveBeenCalledWith('k1');
      expect(mockCodesRef.remove).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: 'custom-token-xyz' });
    });

    it('creates new Firebase user if not found', async () => {
      const code = '123456';
      const snapshot = makeSnapshot([
        { key: 'k1', val: { email: 'new@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 0 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);

      const authError = Object.assign(new Error('User not found'), { code: 'auth/user-not-found' });
      mockAuthAdmin.getUserByEmail.mockRejectedValue(authError);
      mockAuthAdmin.createUser.mockResolvedValue({ uid: 'new-uid-456' });

      const req = makeReq('POST', { email: 'new@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(mockAuthAdmin.createUser).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('normalizes email to lowercase', async () => {
      const code = '123456';
      const snapshot = makeSnapshot([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 0 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);
      mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'uid-123' });

      const req = makeReq('POST', { email: 'USER@EXAMPLE.COM', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(mockAuthAdmin.getUserByEmail).toHaveBeenCalledWith('user@example.com');
    });

    it('increments attempts for non-matching valid codes when correct code is found', async () => {
      const correctCode = '111111';
      const otherCode = '222222';
      const snapshot = makeSnapshot([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(correctCode), expiry: futureExpiry, attempts: 0 } },
        { key: 'k2', val: { email: 'user@example.com', codeHash: hashCode(otherCode), expiry: futureExpiry, attempts: 1 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);
      mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'uid-123' });

      const req = makeReq('POST', { email: 'user@example.com', code: correctCode });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockCodesRef.update).toHaveBeenCalledWith({ 'k2/attempts': 2 });
    });

    it('returns 500 without error details on unexpected error', async () => {
      mockCodesRef.once.mockRejectedValue(new Error('internal db secret error'));

      const req = makeReq('POST', { email: 'user@example.com', code: '123456' });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toEqual({ error: 'Failed to verify sign-in code' });
      expect(responseData).not.toHaveProperty('details');
    });

    it('rethrows non-user-not-found auth errors', async () => {
      const code = '123456';
      const snapshot = makeSnapshot([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 0 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);

      const authError = Object.assign(new Error('Auth service unavailable'), { code: 'auth/internal-error' });
      mockAuthAdmin.getUserByEmail.mockRejectedValue(authError);

      const req = makeReq('POST', { email: 'user@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
