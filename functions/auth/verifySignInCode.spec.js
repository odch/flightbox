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
        updateUser: jest.fn(async (uid, props) => ({ uid, ...props })),
        revokeRefreshTokens: jest.fn().mockResolvedValue(),
        createCustomToken: jest.fn().mockResolvedValue('custom-token-xyz'),
      };

      mockAdmin = {
        getDatabase: jest.fn().mockReturnValue({
          ref: jest.fn().mockReturnValue(mockCodesRef)
        }),
        getAuth: jest.fn().mockReturnValue(mockAuthAdmin),
      };

      jest.mock('firebase-admin/database', () => mockAdmin);
      jest.mock('firebase-admin/auth', () => mockAdmin);
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

    it.each([
      [{ email: 42, code: '123456' }],
      [{ email: ['user@example.com'], code: '123456' }],
      [{ email: 'not-an-email', code: '123456' }],
      [{ email: 'user@example.com', code: 123456 }],
      [{ email: 'user@example.com', code: ['123456'] }],
      [{ email: 'user@example.com', code: '12345' }],
      [{ email: 'user@example.com', code: '1234567' }],
      [{ email: 'user@example.com', code: '12345a' }],
    ])('returns 400 without counting an attempt for the malformed request %p', async (body) => {
      setupCodes([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode('123456'), expiry: futureExpiry, attempts: 0 } },
      ]);

      const req = makeReq('POST', body);
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired code' });
      expect(transactionCalls).toEqual([]);
      expect(records.k1.attempts).toBe(0);
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
      mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'user-uid-123', emailVerified: true });

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
      mockAuthAdmin.createUser.mockResolvedValue({ uid: 'new-uid-456', emailVerified: true });

      const req = makeReq('POST', { email: 'new@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(mockAuthAdmin.createUser).toHaveBeenCalledWith({ email: 'new@example.com', emailVerified: true });
      expect(mockAuthAdmin.updateUser).not.toHaveBeenCalled();
      expect(mockAuthAdmin.createCustomToken).toHaveBeenCalledWith('new-uid-456', { email: 'new@example.com' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    describe('user verification', () => {
      const code = '123456';

      beforeEach(() => {
        setupCodes([
          { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 0 } },
        ]);
      });

      const signIn = async () => {
        const res = makeRes();
        await capturedHandler(makeReq('POST', { email: 'user@example.com', code }), res);
        return res;
      };

      it('leaves a verified user as it is', async () => {
        mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'uid-1', emailVerified: true, providerData: [{ providerId: 'password' }] });

        const res = await signIn();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockAuthAdmin.updateUser).not.toHaveBeenCalled();
        expect(mockAuthAdmin.revokeRefreshTokens).not.toHaveBeenCalled();
      });

      it.each([
        ['registered with a password', [{ providerId: 'password' }]],
        // e.g. created by an earlier code sign-in, or a password unlinked again
        ['without a password', []],
      ])('takes over an unverified account %s', async (_, providerData) => {
        mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'uid-1', emailVerified: false, providerData });

        const res = await signIn();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockAuthAdmin.updateUser).toHaveBeenCalledWith('uid-1', {
          emailVerified: true,
          password: expect.any(String),
        });
        const { password } = mockAuthAdmin.updateUser.mock.calls[0][1];
        expect(password.length).toBeGreaterThanOrEqual(40);
        expect(mockAuthAdmin.revokeRefreshTokens).toHaveBeenCalledWith('uid-1');
        // Sessions are ended before the new token is handed out.
        expect(mockAuthAdmin.revokeRefreshTokens.mock.invocationCallOrder[0])
          .toBeLessThan(mockAuthAdmin.createCustomToken.mock.invocationCallOrder[0]);
        expect(mockAuthAdmin.createCustomToken).toHaveBeenCalledWith('uid-1', { email: 'user@example.com' });
      });

      it('uses the user created by a concurrent sign-in when creation races', async () => {
        const notFound = Object.assign(new Error('User not found'), { code: 'auth/user-not-found' });
        const exists = Object.assign(new Error('Email exists'), { code: 'auth/email-already-exists' });
        mockAuthAdmin.getUserByEmail
          .mockRejectedValueOnce(notFound)
          .mockResolvedValueOnce({ uid: 'uid-race', emailVerified: true, providerData: [] });
        mockAuthAdmin.createUser.mockRejectedValue(exists);

        const res = await signIn();

        expect(res.status).toHaveBeenCalledWith(200);
        expect(mockAuthAdmin.createCustomToken).toHaveBeenCalledWith('uid-race', { email: 'user@example.com' });
      });

      it('fails on other user creation errors', async () => {
        const notFound = Object.assign(new Error('User not found'), { code: 'auth/user-not-found' });
        mockAuthAdmin.getUserByEmail.mockRejectedValue(notFound);
        mockAuthAdmin.createUser.mockRejectedValue(Object.assign(new Error('boom'), { code: 'auth/internal-error' }));

        const res = await signIn();

        expect(res.status).toHaveBeenCalledWith(500);
        expect(mockAuthAdmin.createCustomToken).not.toHaveBeenCalled();
      });
    });

    it('normalizes email to lowercase', async () => {
      const code = '123456';
      setupCodes([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 0 } },
      ]);
      mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'uid-123', emailVerified: true });

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
      mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'uid-123', emailVerified: true });

      const req = makeReq('POST', { email: 'user@example.com', code: correctCode });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // The non-matching code was counted; the matching code was consumed.
      expect(records.k1.attempts).toBe(2);
      expect(records.k2).toBeUndefined();
    });

    it('rejects a code that was consumed while the transaction retried', async () => {
      const code = '123456';
      setupCodes([
        { key: 'k1', val: { email: 'user@example.com', codeHash: hashCode(code), expiry: futureExpiry, attempts: 0 } },
      ]);
      // RTDB runs the update function against a cached value first and again
      // against the server's value when they differ. Here the cache still holds
      // the code, but a concurrent sign-in has already consumed it.
      mockCodesRef.child.mockImplementation((key) => ({
        transaction: async (updateFn) => {
          transactionCalls.push(key);
          updateFn(records[key]);
          delete records[key];
          const next = updateFn(null);
          return { committed: true, snapshot: { val: () => next } };
        },
      }));

      const req = makeReq('POST', { email: 'user@example.com', code });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired code' });
      expect(mockAuthAdmin.createCustomToken).not.toHaveBeenCalled();
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
