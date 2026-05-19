describe('functions', () => {
  describe('auth/verifyRegistration', () => {
    let mockAdmin;
    let mockCors;
    let capturedHandler;
    let mockDbRef;
    let mockVerifyRegistrationResponse;
    let mockConsumeChallenge;
    let mockVerifyRecentAuth;
    let mockGetRpConfig;

    const makeCredentialIdBuffer = () => Buffer.from('credid-bytes');
    const credentialIdBase64url = Buffer.from('credid-bytes').toString('base64url');
    const publicKeyBase64url = Buffer.from('pubkey-bytes').toString('base64url');

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;

      mockCors = jest.fn().mockImplementation((req, res, cb) => cb());

      mockDbRef = {
        child: jest.fn().mockReturnThis(),
        set: jest.fn().mockResolvedValue(undefined),
      };

      mockAdmin = {
        database: jest.fn().mockReturnValue({ ref: jest.fn().mockReturnValue(mockDbRef) }),
      };

      mockVerifyRegistrationResponse = jest.fn();
      mockConsumeChallenge = jest.fn();
      mockVerifyRecentAuth = jest.fn();
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
        verifyRegistrationResponse: mockVerifyRegistrationResponse,
      }));
      jest.mock('./webauthnHelpers', () => {
        class AuthError extends Error {
          constructor(m) { super(m); this.name = 'AuthError'; }
        }
        return {
          AuthError,
          getRpConfig: mockGetRpConfig,
          consumeChallenge: mockConsumeChallenge,
          verifyAuthenticatedUser: mockVerifyRecentAuth,
        };
      });

      require('./verifyRegistration');
    });

    const makeReq = (method, body = {}) => ({ method, headers: { authorization: 'Bearer x' }, body });
    const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });

    it('returns 405 on GET', async () => {
      const res = makeRes();
      await capturedHandler(makeReq('GET'), res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 401 on auth error', async () => {
      const { AuthError } = require('./webauthnHelpers');
      mockVerifyRecentAuth.mockRejectedValue(new AuthError('nope'));
      const res = makeRes();
      await capturedHandler(makeReq('POST', {}), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 when challengeKey missing', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1', email: 'a@b.c' });
      const res = makeRes();
      await capturedHandler(makeReq('POST', { attestationResponse: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 on invalid challenge', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1', email: 'a@b.c' });
      mockConsumeChallenge.mockRejectedValue(new Error('expired'));
      const res = makeRes();
      await capturedHandler(makeReq('POST', { challengeKey: 'k', attestationResponse: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired challenge' });
    });

    it('returns 400 when challenge uid does not match', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1', email: 'a@b.c' });
      mockConsumeChallenge.mockResolvedValue({ uid: 'other-uid', challenge: 'c' });
      const res = makeRes();
      await capturedHandler(makeReq('POST', { challengeKey: 'k', attestationResponse: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when verification rejects', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1', email: 'a@b.c' });
      mockConsumeChallenge.mockResolvedValue({ uid: 'u1', challenge: 'c' });
      mockVerifyRegistrationResponse.mockRejectedValue(new Error('bad attestation'));
      const res = makeRes();
      await capturedHandler(makeReq('POST', { challengeKey: 'k', attestationResponse: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when verification is not verified', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1', email: 'a@b.c' });
      mockConsumeChallenge.mockResolvedValue({ uid: 'u1', challenge: 'c' });
      mockVerifyRegistrationResponse.mockResolvedValue({ verified: false });
      const res = makeRes();
      await capturedHandler(makeReq('POST', { challengeKey: 'k', attestationResponse: {} }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('stores credential and returns summary on success (v10 shape)', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1', email: 'a@b.c' });
      mockConsumeChallenge.mockResolvedValue({ uid: 'u1', challenge: 'c' });
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: makeCredentialIdBuffer(),
            publicKey: Buffer.from('pubkey-bytes'),
            counter: 0,
            transports: ['internal'],
          },
          aaguid: 'aa-guid',
          credentialBackedUp: false,
          credentialDeviceType: 'singleDevice',
        },
      });

      const res = makeRes();
      await capturedHandler(makeReq('POST', {
        challengeKey: 'k',
        attestationResponse: { response: { transports: ['internal'] } },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.success).toBe(true);
      expect(responseBody.credentialId).toBe(credentialIdBase64url);
      expect(responseBody.deviceName).toBe('Mac');

      // Credential was stored under uid + credentialID
      const setCalls = mockDbRef.set.mock.calls;
      expect(setCalls.length).toBe(2);
      const credRecord = setCalls[0][0];
      expect(credRecord.publicKey).toBe(publicKeyBase64url);
      expect(credRecord.counter).toBe(0);
      expect(credRecord.transports).toEqual(['internal']);
      expect(credRecord.deviceName).toBe('Mac');
      expect(setCalls[1][0]).toEqual({ uid: 'u1' });
    });

    it('supports legacy flat registrationInfo shape', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1', email: 'a@b.c' });
      mockConsumeChallenge.mockResolvedValue({ uid: 'u1', challenge: 'c' });
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credentialID: makeCredentialIdBuffer(),
          credentialPublicKey: Buffer.from('pubkey-bytes'),
          counter: 0,
          aaguid: null,
        },
      });

      const res = makeRes();
      await capturedHandler(makeReq('POST', {
        challengeKey: 'k',
        attestationResponse: { response: {} },
      }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json.mock.calls[0][0].deviceName).toBe('Passkey');
    });

    it('derives device name from user-agent variants', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1', email: 'a@b.c' });
      mockConsumeChallenge.mockResolvedValue({ uid: 'u1', challenge: 'c' });
      mockVerifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: makeCredentialIdBuffer(),
            publicKey: Buffer.from('pubkey-bytes'),
            counter: 0,
          },
        },
      });

      const cases = [
        ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', 'iPhone'],
        ['Mozilla/5.0 (iPad; CPU OS 17_0)', 'iPad'],
        ['Mozilla/5.0 (Linux; Android 14)', 'Android'],
        ['Mozilla/5.0 (Windows NT 10.0)', 'Windows'],
        ['Mozilla/5.0 (X11; Linux x86_64)', 'Linux'],
        ['weird-ua', 'Passkey'],
      ];

      for (const [ua, expected] of cases) {
        mockDbRef.set.mockClear();
        const res = makeRes();
        await capturedHandler(makeReq('POST', {
          challengeKey: 'k',
          attestationResponse: { response: {} },
          userAgent: ua,
        }), res);
        expect(res.json.mock.calls[0][0].deviceName).toBe(expected);
      }
    });
  });
});
