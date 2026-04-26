describe('functions', () => {
  describe('auth/generateRegistrationOptions', () => {
    let mockAdmin;
    let mockFunctions;
    let mockCors;
    let capturedHandler;
    let mockCredentialsRef;
    let mockGenerateRegistrationOptions;
    let mockPersistChallenge;
    let mockVerifyRecentAuth;
    let mockGetRpConfig;

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;

      mockCors = jest.fn().mockImplementation((req, res, cb) => cb());

      mockFunctions = {
        https: {
          onRequest: jest.fn().mockImplementation(handler => { capturedHandler = handler; }),
        },
      };
      mockFunctions.region = jest.fn(() => mockFunctions);

      mockCredentialsRef = {
        child: jest.fn().mockReturnThis(),
        once: jest.fn().mockResolvedValue({ exists: () => false, val: () => null }),
      };

      mockAdmin = {
        database: jest.fn().mockReturnValue({
          ref: jest.fn().mockReturnValue(mockCredentialsRef),
        }),
      };

      mockGenerateRegistrationOptions = jest.fn().mockResolvedValue({
        challenge: 'server-challenge',
        rp: { id: 'flightbox.ch' },
        user: { id: 'u1', name: 'user@example.com' },
      });

      mockPersistChallenge = jest.fn().mockResolvedValue('challenge-key-123');
      mockVerifyRecentAuth = jest.fn();
      mockGetRpConfig = jest.fn().mockReturnValue({
        rpID: 'flightbox.ch',
        rpName: 'Flightbox',
        expectedOrigins: ['https://flightbox.ch'],
      });

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('firebase-functions/v1', () => mockFunctions);
      jest.mock('cors', () => () => mockCors);
      jest.mock('@simplewebauthn/server', () => ({
        generateRegistrationOptions: mockGenerateRegistrationOptions,
      }));
      jest.mock('./webauthnHelpers', () => {
        class AuthError extends Error {
          constructor(msg) { super(msg); this.name = 'AuthError'; }
        }
        return {
          AuthError,
          getRpConfig: mockGetRpConfig,
          persistChallenge: mockPersistChallenge,
          verifyAuthenticatedUser: mockVerifyRecentAuth,
        };
      });

      require('./generateRegistrationOptions');
    });

    const makeReq = (method, headers = {}, body = {}) => ({ method, headers, body });
    const makeRes = () => ({
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    });

    it('returns 405 on GET', async () => {
      const res = makeRes();
      await capturedHandler(makeReq('GET'), res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 401 when verifyAuthenticatedUser rejects with AuthError', async () => {
      const { AuthError } = require('./webauthnHelpers');
      mockVerifyRecentAuth.mockRejectedValue(new AuthError('Missing header'));
      const res = makeRes();
      await capturedHandler(makeReq('POST'), res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing header' });
    });

    it('returns 500 on unexpected error during auth verify', async () => {
      mockVerifyRecentAuth.mockRejectedValue(new Error('internal'));
      const res = makeRes();
      await capturedHandler(makeReq('POST'), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns options + challengeKey on success', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1', email: 'user@example.com' });

      const res = makeRes();
      await capturedHandler(makeReq('POST'), res);

      expect(mockGenerateRegistrationOptions).toHaveBeenCalledWith(expect.objectContaining({
        rpID: 'flightbox.ch',
        rpName: 'Flightbox',
        userName: 'user@example.com',
        attestationType: 'none',
        excludeCredentials: [],
        authenticatorSelection: expect.objectContaining({
          residentKey: 'preferred',
          userVerification: 'preferred',
        }),
      }));

      expect(mockPersistChallenge).toHaveBeenCalledWith({
        type: 'registration',
        challenge: 'server-challenge',
        uid: 'u1',
        email: 'user@example.com',
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        options: expect.objectContaining({ challenge: 'server-challenge' }),
        challengeKey: 'challenge-key-123',
      });
    });

    it('passes existing credentials in excludeCredentials', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1', email: 'u@e.com' });

      mockCredentialsRef.once.mockResolvedValue({
        exists: () => true,
        val: () => ({
          'Y3JlZDE': { transports: ['internal'] },
          'Y3JlZDI': { transports: ['usb'] },
        }),
      });

      const res = makeRes();
      await capturedHandler(makeReq('POST'), res);

      const call = mockGenerateRegistrationOptions.mock.calls[0][0];
      expect(call.excludeCredentials).toHaveLength(2);
      expect(call.excludeCredentials[0].transports).toEqual(['internal']);
      expect(call.excludeCredentials[1].transports).toEqual(['usb']);
    });
  });
});
