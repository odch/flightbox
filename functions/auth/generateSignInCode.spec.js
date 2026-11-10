describe('functions', () => {
  describe('auth/generateSignInCode', () => {
    let mockAdmin;
    let mockSendSignInEmail;
    let capturedHandler;
    let mockCors;
    let mockPush;
    let mockUpdate;
    let mockOnce;
    let mockTransaction;

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;

      mockPush = jest.fn().mockResolvedValue({ key: 'code-key-123' });
      mockUpdate = jest.fn().mockResolvedValue();
      // default: no existing codes for the email
      mockOnce = jest.fn().mockResolvedValue({ exists: () => false, forEach: () => {} });
      // default: rate-limit transaction commits (request allowed)
      mockTransaction = jest.fn().mockResolvedValue({ committed: true });

      const codesRef = {
        orderByChild: jest.fn().mockReturnValue({
          equalTo: jest.fn().mockReturnValue({ once: mockOnce })
        }),
        update: mockUpdate,
        push: mockPush,
      };
      const rateLimitRef = { transaction: mockTransaction };

      mockAdmin = {
        getDatabase: jest.fn().mockReturnValue({
          ref: jest.fn(path => path.startsWith('/signInRateLimits') ? rateLimitRef : codesRef)
        })
      };

      mockCors = jest.fn().mockImplementation((req, res, cb) => cb());

      mockSendSignInEmail = jest.fn().mockResolvedValue('msg123');

      jest.mock('firebase-admin/database', () => mockAdmin);
      jest.mock('firebase-functions/v2/https', () => ({
        onRequest: (opts, handler) => { capturedHandler = handler; },
      }));
      jest.mock('cors', () => () => mockCors);
      jest.mock('./sendSignInEmail', () => ({ sendSignInEmail: mockSendSignInEmail }));

      require('./generateSignInCode');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const makeReq = (method, body) => ({ method, body });
    const makeRes = () => ({
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn().mockReturnThis(),
    });

    it('returns 405 for GET request', async () => {
      const req = makeReq('GET', {});
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('returns 400 when email is missing', async () => {
      const req = makeReq('POST', {});
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
    });

    it('returns 400 for invalid email format', async () => {
      const req = makeReq('POST', { email: 'not-an-email' });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email format' });
    });

    it.each([
      [42],
      [['user@example.com']],
      [{ email: 'user@example.com' }],
      ['a1,victim@example.com'],
      ['"x",victim@example.com'],
      [`${'a'.repeat(250)}@example.com`],
    ])('returns 400 and sends nothing for the email %p', async (email) => {
      const req = makeReq('POST', { email });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email format' });
      expect(mockTransaction).not.toHaveBeenCalled();
      expect(mockSendSignInEmail).not.toHaveBeenCalled();
    });

    it('returns 429 with a retry time and sends nothing when rate limited', async () => {
      const now = Date.now();
      // hourly cap reached: window started ~20 min ago, so ~40 min remain
      mockTransaction.mockResolvedValue({
        committed: false,
        snapshot: { val: () => ({ windowStart: now - 20 * 60 * 1000, lastSentAt: now - 1000, count: 10 }) },
      });

      const req = makeReq('POST', { email: 'user@example.com' });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      const body = res.json.mock.calls[0][0];
      expect(body.error).toBe('Too many requests. Please try again later.');
      // ~40 minutes remaining (2400s), allow a small margin
      expect(body.retryAfterSeconds).toBeGreaterThan(2300);
      expect(body.retryAfterSeconds).toBeLessThanOrEqual(2400);
      expect(res.set).toHaveBeenCalledWith('Retry-After', String(body.retryAfterSeconds));
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockSendSignInEmail).not.toHaveBeenCalled();
    });

    it('uses the cooldown remaining for retryAfterSeconds when under the cap', async () => {
      const now = Date.now();
      // within cooldown: last send 10s ago, count under cap -> ~45s remain
      mockTransaction.mockResolvedValue({
        committed: false,
        snapshot: { val: () => ({ windowStart: now - 5000, lastSentAt: now - 10000, count: 2 }) },
      });

      const req = makeReq('POST', { email: 'user@example.com' });
      const res = makeRes();
      await capturedHandler(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.retryAfterSeconds).toBeGreaterThan(40);
      expect(body.retryAfterSeconds).toBeLessThanOrEqual(45);
    });

    describe('rate limiter', () => {
      const hour = 60 * 60 * 1000;
      let now;

      // Runs the limiter's update function the way RTDB would, against the
      // given current state, and returns what it would write (undefined = abort).
      const runLimiter = async (current, email = 'user@example.com') => {
        let written;
        mockTransaction.mockImplementation(async (updateFn) => {
          written = updateFn(current);
          return written === undefined
            ? { committed: false, snapshot: { val: () => current } }
            : { committed: true, snapshot: { val: () => written } };
        });
        const res = makeRes();
        await capturedHandler(makeReq('POST', { email }), res);
        return { written, res };
      };

      beforeEach(() => {
        now = 1700000000000;
        jest.spyOn(Date, 'now').mockReturnValue(now);
      });

      it('starts both windows on the first send', async () => {
        const { written, res } = await runLimiter(null);
        expect(written).toEqual({ windowStart: now, count: 1, dayWindowStart: now, dayCount: 1, lastSentAt: now });
        expect(res.status).toHaveBeenCalledWith(200);
      });

      it('counts a send in both running windows', async () => {
        const current = { windowStart: now - 10 * 60 * 1000, count: 3, dayWindowStart: now - 5 * hour, dayCount: 12, lastSentAt: now - 60 * 1000 };
        const { written } = await runLimiter(current);
        expect(written).toEqual({ windowStart: current.windowStart, count: 4, dayWindowStart: current.dayWindowStart, dayCount: 13, lastSentAt: now });
      });

      it('restarts the hourly window but keeps counting the daily one', async () => {
        const current = { windowStart: now - 2 * hour, count: 10, dayWindowStart: now - 5 * hour, dayCount: 12, lastSentAt: now - 2 * hour };
        const { written } = await runLimiter(current);
        expect(written).toEqual({ windowStart: now, count: 1, dayWindowStart: current.dayWindowStart, dayCount: 13, lastSentAt: now });
      });

      it('starts a daily window for an entry written before the daily cap existed', async () => {
        const current = { windowStart: now - 10 * 60 * 1000, count: 3, lastSentAt: now - 60 * 1000 };
        const { written } = await runLimiter(current);
        expect(written).toEqual({ windowStart: current.windowStart, count: 4, dayWindowStart: now, dayCount: 1, lastSentAt: now });
      });

      it('rejects with the daily wait once the daily cap is reached', async () => {
        const current = { windowStart: now - 2 * hour, count: 2, dayWindowStart: now - 20 * hour, dayCount: 20, lastSentAt: now - 2 * hour };
        const { written, res } = await runLimiter(current);
        expect(written).toBeUndefined();
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json.mock.calls[0][0].retryAfterSeconds).toBe(4 * 60 * 60);
        expect(mockSendSignInEmail).not.toHaveBeenCalled();
      });

      it('reports the longest wait when several limits apply', async () => {
        const current = { windowStart: now - 20 * 60 * 1000, count: 10, dayWindowStart: now - 20 * 60 * 1000, dayCount: 10, lastSentAt: now - 10 * 1000 };
        const { res } = await runLimiter(current);
        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json.mock.calls[0][0].retryAfterSeconds).toBe(40 * 60);
      });

      it('shares one limit between addresses delivering to the same mailbox', async () => {
        const keyOf = async (email) => {
          await runLimiter(null, email);
          const { calls } = mockAdmin.getDatabase().ref.mock;
          return calls.map(([path]) => path).filter(path => path.startsWith('/signInRateLimits/')).pop();
        };
        const key = await keyOf('pilot@gmail.com');
        expect(await keyOf('p.ilot+flightbox@gmail.com')).toBe(key);
        expect(await keyOf('pilot@googlemail.com')).toBe(key);
        expect(await keyOf('other@gmail.com')).not.toBe(key);
      });
    });

    it('deletes existing codes for the email before pushing a new one', async () => {
      mockOnce.mockResolvedValue({
        exists: () => true,
        forEach: cb => {
          cb({ key: 'old-1' });
          cb({ key: 'old-2' });
        }
      });

      const req = makeReq('POST', { email: 'user@example.com' });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(mockUpdate).toHaveBeenCalledWith({ 'old-1': null, 'old-2': null });
      expect(mockPush).toHaveBeenCalled();
      // deletion happens before the new code is pushed
      expect(mockUpdate.mock.invocationCallOrder[0]).toBeLessThan(mockPush.mock.invocationCallOrder[0]);
    });

    it('stores code hash in database (not plaintext code)', async () => {
      const req = makeReq('POST', {
        email: 'user@example.com',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          codeHash: expect.any(String),
          expiry: expect.any(Number),
          attempts: 0,
        })
      );

      // Verify that the pushed object does NOT contain the plaintext code
      const pushedData = mockPush.mock.calls[0][0];
      expect(pushedData).not.toHaveProperty('code');
    });

    it('normalizes email to lowercase before storing', async () => {
      const req = makeReq('POST', { email: 'User@Example.COM' });
      const res = makeRes();
      await capturedHandler(req, res);

      const pushedData = mockPush.mock.calls[0][0];
      expect(pushedData.email).toBe('user@example.com');
    });

    it('trims the email before storing and sending', async () => {
      const req = makeReq('POST', { email: '  User@Example.com ' });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(mockPush.mock.calls[0][0].email).toBe('user@example.com');
      expect(mockSendSignInEmail.mock.calls[0][0].email).toBe('user@example.com');
    });

    it('sends email server-side with correct parameters', async () => {
      const req = makeReq('POST', {
        email: 'user@example.com',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(mockSendSignInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
          signInCode: expect.any(String),
          airportName: 'Thun',
          themeColor: '#003863',
        })
      );
    });

    it('returns success without code in response', async () => {
      const req = makeReq('POST', {
        email: 'user@example.com',
        airportName: 'Thun',
        themeColor: '#003863'
      });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toEqual({ success: true });
      expect(responseData).not.toHaveProperty('code');
    });

    it('returns 500 without error details when sendSignInEmail throws', async () => {
      mockSendSignInEmail.mockRejectedValue(new Error('SMTP connection failed: password=secret123'));

      const req = makeReq('POST', { email: 'user@example.com' });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toEqual({ error: 'Failed to send sign-in code' });
      expect(responseData).not.toHaveProperty('details');
    });

    it('returns 500 without error details when database push throws', async () => {
      mockPush.mockRejectedValue(new Error('DB permission denied'));

      const req = makeReq('POST', { email: 'user@example.com' });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData).toEqual({ error: 'Failed to send sign-in code' });
      expect(responseData).not.toHaveProperty('details');
    });

    it('sets expiry approximately 10 minutes in the future', async () => {
      const before = Date.now();
      const req = makeReq('POST', { email: 'user@example.com' });
      const res = makeRes();
      await capturedHandler(req, res);
      const after = Date.now();

      const pushedData = mockPush.mock.calls[0][0];
      const tenMinutesMs = 10 * 60 * 1000;
      expect(pushedData.expiry).toBeGreaterThanOrEqual(before + tenMinutesMs);
      expect(pushedData.expiry).toBeLessThanOrEqual(after + tenMinutesMs);
    });

    it('stores SHA-256 hash of code, not plaintext', async () => {
      const crypto = require('crypto');
      const req = makeReq('POST', { email: 'user@example.com' });
      const res = makeRes();
      await capturedHandler(req, res);

      const pushedData = mockPush.mock.calls[0][0];
      // The sent signInCode should hash to the stored codeHash
      const sentCode = mockSendSignInEmail.mock.calls[0][0].signInCode;
      const expectedHash = crypto.createHash('sha256').update(sentCode).digest('hex');
      expect(pushedData.codeHash).toBe(expectedHash);
    });
  });
});
