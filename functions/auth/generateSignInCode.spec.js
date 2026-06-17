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
        database: jest.fn().mockReturnValue({
          ref: jest.fn(path => path.startsWith('/signInRateLimits') ? rateLimitRef : codesRef)
        })
      };

      mockCors = jest.fn().mockImplementation((req, res, cb) => cb());

      mockSendSignInEmail = jest.fn().mockResolvedValue('msg123');

      jest.mock('firebase-admin', () => mockAdmin);
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
      json: jest.fn()
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

    it('returns 429 and sends nothing when rate limited (cooldown / cap)', async () => {
      mockTransaction.mockResolvedValue({ committed: false });

      const req = makeReq('POST', { email: 'user@example.com' });
      const res = makeRes();
      await capturedHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({ error: 'Too many requests. Please try again later.' });
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockSendSignInEmail).not.toHaveBeenCalled();
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
