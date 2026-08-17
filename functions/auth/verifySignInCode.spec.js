const crypto = require('crypto');

const hashCode = (code) => crypto.createHash('sha256').update(code).digest('hex');

describe('functions', () => {
  describe('auth/verifySignInCode', () => {
    let mockAdmin;
    let capturedHandler;
    let mockCors;
    let mockCodesRef;
    let mockAuthAdmin;
    let records; // in-memory /signInCodes store, keyed by code key
    let transactionCalls;

    const now = Date.now();
    const futureExpiry = now + 10 * 60 * 1000;

    // Configure the /signInCodes query result and the backing store for the
    // per-node transactions. `entries` is [{ key, val }].
    const setupCodes = (entries) => {
      records = {};
      entries.forEach(({ key, val }) => { records[key] = { ...val }; });
      mockCodesRef.once.mockResolvedValue({
        exists: () => entries.length > 0,
        forEach: (cb) => entries.forEach(({ key }) => cb({ key })),
      });
    };

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;
      records = {};
      transactionCalls = [];

      mockCors = jest.fn().mockImplementation((req, res, cb) => cb());

      mockCodesRef = {
        orderByChild: jest.fn().mockReturnThis(),
        equalTo: jest.fn().mockReturnThis(),
        once: jest.fn(),
        // Atomic per-node transaction, backed by `records`.
        child: jest.fn((key) => ({
          transaction: async (updateFn) => {
            transactionCalls.push(key);
            const current = key in records ? records[key] : null;
            const next = updateFn(current);
            if (next === undefined) {
              return { committed: false, snapshot: { val: () => current } };
            }
            if (next === null) {
              delete records[key];
              return { committed: true, snapshot: { val: () => null } };
            }
            records[key] = next;
            return { committed: true, snapshot: { val: () => next } };
          },
        })),
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
      jest.mock('firebase-functions/v2/https', () => ({
        onRequest: (opts, handler) => { capturedHandler = handler; },
      }));
      jest.mock('cors', () => () => mockCors);

      require('./verifySignInCode');
    });

    const makeReq = (method, body) => ({ method, body });
    const makeRes = () => ({
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    });

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
      setupCodes([]);

      const req = makeReq('POST', { email: 'user@example.com', code: '123456' });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired code' });
    });

    it('returns 400 for wrong code and atomically increments attempts', async () => {
      const correctCode = '111111';
      setupCodes([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(correctCode), expiry: futureExpiry, attempts: 0 } },
      ]);

      const req = makeReq('POST', { email: 'user@example.com', code: '999999' });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired code' });
      // Increment happened through a transaction on the code node, not a
      // read-then-write update.
      expect(transactionCalls).toEqual(['k1']);
      expect(records.k1.attempts).toBe(1);
    });

    it('returns 400 for expired code without incrementing attempts', async () => {
      const code = '123456';
      setupCodes([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: now - 1000, attempts: 0 } },
      ]);

      const req = makeReq('POST', { email: 'user@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(records.k1.attempts).toBe(0);
    });

    it('returns 400 for exhausted code (max attempts reached) without incrementing', async () => {
      const code = '123456';
      setupCodes([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 5 } },
      ]);

      const req = makeReq('POST', { email: 'user@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      // Capped: even the correct code is rejected and attempts is not bumped past the cap.
      expect(records.k1.attempts).toBe(5);
      expect(mockAuthAdmin.createCustomToken).not.toHaveBeenCalled();
    });

    it('enforces the attempt cap across repeated wrong guesses', async () => {
      const correctCode = '111111';
      setupCodes([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(correctCode), expiry: futureExpiry, attempts: 0 } },
      ]);

      // Five wrong guesses each count exactly once (atomic), reaching the cap.
      for (let i = 1; i <= 5; i++) {
        const res = makeRes();
        await capturedHandler(makeReq('POST', { email: 'user@example.com', code: '999999' }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(records.k1.attempts).toBe(i);
      }

      // The correct code is now locked out — brute force is bounded.
      const res = makeRes();
      await capturedHandler(makeReq('POST', { email: 'user@example.com', code: correctCode }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(records.k1).toBeDefined(); // not consumed
      expect(mockAuthAdmin.createCustomToken).not.toHaveBeenCalled();
    });

    it('returns 200 with token on valid code and consumes the code atomically', async () => {
      const code = '123456';
      setupCodes([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 0 } },
      ]);
      mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'user-uid-123' });

      const req = makeReq('POST', { email: 'user@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(transactionCalls).toEqual(['k1']);
      expect(records.k1).toBeUndefined(); // consumed by the transaction
      expect(mockAuthAdmin.createCustomToken).toHaveBeenCalledWith('user-uid-123', { email: 'user@example.com' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: 'custom-token-xyz' });
    });

    it('creates new Firebase user if not found', async () => {
      const code = '123456';
      setupCodes([
        { key: 'k1', val: { email: 'new@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 0 } },
      ]);

      const authError = Object.assign(new Error('User not found'), { code: 'auth/user-not-found' });
      mockAuthAdmin.getUserByEmail.mockRejectedValue(authError);
      mockAuthAdmin.createUser.mockResolvedValue({ uid: 'new-uid-456' });

      const req = makeReq('POST', { email: 'new@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(mockAuthAdmin.createUser).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(mockAuthAdmin.createCustomToken).toHaveBeenCalledWith('new-uid-456', { email: 'new@example.com' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('normalizes email to lowercase', async () => {
      const code = '123456';
      setupCodes([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 0 } },
      ]);
      mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'uid-123' });

      const req = makeReq('POST', { email: 'USER@EXAMPLE.COM', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(mockAuthAdmin.getUserByEmail).toHaveBeenCalledWith('user@example.com');
    });

    it('counts a wrong guess against a non-matching code then succeeds on the matching one', async () => {
      const correctCode = '111111';
      const otherCode = '222222';
      setupCodes([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(otherCode), expiry: futureExpiry, attempts: 1 } },
        { key: 'k2', val: { email: 'user@example.com', codeHash: hashCode(correctCode), expiry: futureExpiry, attempts: 0 } },
      ]);
      mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'uid-123' });

      const req = makeReq('POST', { email: 'user@example.com', code: correctCode });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // The non-matching code was counted; the matching code was consumed.
      expect(records.k1.attempts).toBe(2);
      expect(records.k2).toBeUndefined();
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
      setupCodes([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 0 } },
      ]);

      const authError = Object.assign(new Error('Auth service unavailable'), { code: 'auth/internal-error' });
      mockAuthAdmin.getUserByEmail.mockRejectedValue(authError);

      const req = makeReq('POST', { email: 'user@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
