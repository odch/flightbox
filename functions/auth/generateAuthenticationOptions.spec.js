describe('functions', () => {
  describe('auth/generateAuthenticationOptions', () => {
    let mockAdmin;
    let mockCors;
    let capturedHandler;
    let mockCredentialsRef;
    let mockAuthAdmin;
    let mockGenerateAuthenticationOptions;
    let mockPersistChallenge;
    let mockGetRpConfig;

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;

      mockCors = jest.fn().mockImplementation((req, res, cb) => cb());

      mockCredentialsRef = {
        child: jest.fn().mockReturnThis(),
        once: jest.fn().mockResolvedValue({ exists: () => false, val: () => null }),
      };

      mockAuthAdmin = {
        getUserByEmail: jest.fn(),
      };

      mockAdmin = {
        database: jest.fn().mockReturnValue({ ref: jest.fn().mockReturnValue(mockCredentialsRef) }),
        auth: jest.fn().mockReturnValue(mockAuthAdmin),
      };

      mockGenerateAuthenticationOptions = jest.fn().mockResolvedValue({
        challenge: 'auth-challenge',
        rpId: 'flightbox.ch',
      });
      mockPersistChallenge = jest.fn().mockResolvedValue('ck-456');
      mockGetRpConfig = jest.fn().mockReturnValue({
        rpID: 'flightbox.ch',
        expectedOrigins: ['https://flightbox.ch'],
      });

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('firebase-functions/v2/https', () => ({
        onRequest: (opts, handler) => { capturedHandler = handler; },
      }));
      jest.mock('cors', () => () => mockCors);
      jest.mock('@simplewebauthn/server', () => ({
        generateAuthenticationOptions: mockGenerateAuthenticationOptions,
      }));
      jest.mock('./webauthnHelpers', () => ({
        getRpConfig: mockGetRpConfig,
        persistChallenge: mockPersistChallenge,
      }));

      require('./generateAuthenticationOptions');
    });

    const makeReq = (method, body = {}) => ({ method, body });
    const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

    it('returns 405 on GET', async () => {
      const res = makeRes();
      await capturedHandler(makeReq('GET'), res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 400 on invalid email format', async () => {
      const res = makeRes();
      await capturedHandler(makeReq('POST', { email: 'not-an-email' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns usernameless options when no email given', async () => {
      const res = makeRes();
      await capturedHandler(makeReq('POST', {}), res);

      expect(mockGenerateAuthenticationOptions).toHaveBeenCalledWith(expect.objectContaining({
        rpID: 'flightbox.ch',
        allowCredentials: [],
        userVerification: 'preferred',
      }));
      expect(mockPersistChallenge).toHaveBeenCalledWith(expect.objectContaining({
        type: 'authentication',
        uid: null,
        email: null,
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        options: expect.objectContaining({ challenge: 'auth-challenge' }),
        challengeKey: 'ck-456',
      });
    });

    it('returns empty allowCredentials for unknown email without disclosing', async () => {
      const notFound = Object.assign(new Error('no user'), { code: 'auth/user-not-found' });
      mockAuthAdmin.getUserByEmail.mockRejectedValue(notFound);

      const res = makeRes();
      await capturedHandler(makeReq('POST', { email: 'UNKNOWN@Example.com' }), res);

      expect(mockAuthAdmin.getUserByEmail).toHaveBeenCalledWith('unknown@example.com');
      expect(mockGenerateAuthenticationOptions.mock.calls[0][0].allowCredentials).toEqual([]);
      expect(mockPersistChallenge).toHaveBeenCalledWith(expect.objectContaining({
        uid: null,
        email: 'unknown@example.com',
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns populated allowCredentials for known email', async () => {
      mockAuthAdmin.getUserByEmail.mockResolvedValue({ uid: 'u1' });
      mockCredentialsRef.once.mockResolvedValue({
        exists: () => true,
        val: () => ({
          'Y3JlZEE': { transports: ['internal'] },
        }),
      });

      const res = makeRes();
      await capturedHandler(makeReq('POST', { email: 'a@b.c' }), res);

      const call = mockGenerateAuthenticationOptions.mock.calls[0][0];
      expect(call.allowCredentials).toHaveLength(1);
      expect(call.allowCredentials[0].transports).toEqual(['internal']);

      expect(mockPersistChallenge).toHaveBeenCalledWith(expect.objectContaining({
        uid: 'u1',
        email: 'a@b.c',
      }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns 500 on unexpected error', async () => {
      mockGetRpConfig.mockImplementation(() => { throw new Error('boom'); });
      const res = makeRes();
      await capturedHandler(makeReq('POST', {}), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
