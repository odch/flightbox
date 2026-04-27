describe('functions', () => {
  describe('auth/verifyAuthentication', () => {
    let mockAdmin;
    let mockFunctions;
    let mockCors;
    let capturedHandler;
    let mockDbRef;
    let mockAuthAdmin;
    let mockVerifyAuthenticationResponse;
    let mockConsumeChallenge;
    let mockGetRpConfig;

    const credentialId = 'Y3JlZC1pZA';
    const publicKeyB64url = Buffer.from('pk').toString('base64url');

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;

      mockCors = jest.fn().mockImplementation((req, res, cb) => cb());

      mockFunctions = {
        https: { onRequest: jest.fn().mockImplementation(h => { capturedHandler = h; }) },
      };
      mockFunctions.region = jest.fn(() => mockFunctions);

      // Per-ref mocks so we can distinguish calls; all ref paths share one mock for simplicity.
      mockDbRef = {
        child: jest.fn().mockReturnThis(),
        once: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockAuthAdmin = {
        createCustomToken: jest.fn().mockResolvedValue('ct-xyz'),
        getUser: jest.fn(),
      };

      mockAdmin = {
        database: jest.fn().mockReturnValue({ ref: jest.fn().mockReturnValue(mockDbRef) }),
        auth: jest.fn().mockReturnValue(mockAuthAdmin),
      };

      mockVerifyAuthenticationResponse = jest.fn();
      mockConsumeChallenge = jest.fn();
      mockGetRpConfig = jest.fn().mockReturnValue({
        rpID: 'flightbox.ch',
        expectedOrigins: ['https://flightbox.ch'],
      });

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('firebase-functions/v1', () => mockFunctions);
      jest.mock('cors', () => () => mockCors);
      jest.mock('@simplewebauthn/server', () => ({
        verifyAuthenticationResponse: mockVerifyAuthenticationResponse,
      }));
      jest.mock('./webauthnHelpers', () => ({
        getRpConfig: mockGetRpConfig,
        consumeChallenge: mockConsumeChallenge,
      }));

      require('./verifyAuthentication');
    });

    const makeReq = (method, body = {}) => ({ method, body });
    const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
    const snap = (val) => ({ exists: () => val !== null && val !== undefined, val: () => val });

    it('returns 405 on GET', async () => {
      const res = makeRes();
      await capturedHandler(makeReq('GET'), res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 400 when fields missing', async () => {
      const res = makeRes();
      await capturedHandler(makeReq('POST', {}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 on invalid challenge', async () => {
      mockConsumeChallenge.mockRejectedValue(new Error('expired'));
      const res = makeRes();
      await capturedHandler(makeReq('POST', {
        challengeKey: 'k',
        assertionResponse: { id: credentialId },
      }), res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired challenge' });
    });

    it('returns 400 when credential unknown (no owner index)', async () => {
      mockConsumeChallenge.mockResolvedValue({ challenge: 'c', uid: null, email: null });
      mockDbRef.once.mockResolvedValue(snap(null));
      const res = makeRes();
      await capturedHandler(makeReq('POST', {
        challengeKey: 'k',
        assertionResponse: { id: credentialId },
      }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mints custom token with email from challenge on success', async () => {
      mockConsumeChallenge.mockResolvedValue({ challenge: 'c', uid: 'u1', email: 'a@b.c' });
      // Sequence of once calls: loadCredential (uid path)
      mockDbRef.once.mockResolvedValueOnce(snap({
        publicKey: publicKeyB64url,
        counter: 5,
        transports: ['internal'],
      }));
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 6 },
      });

      const res = makeRes();
      await capturedHandler(makeReq('POST', {
        challengeKey: 'k',
        assertionResponse: { id: credentialId },
      }), res);

      expect(mockAuthAdmin.createCustomToken).toHaveBeenCalledWith('u1', { email: 'a@b.c' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: 'ct-xyz' });

      // Lock in the credential parameter shape — a mock-only test would
      // otherwise miss a silent rename of the @simplewebauthn/server contract.
      expect(mockVerifyAuthenticationResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          credential: expect.objectContaining({
            id: credentialId,
            publicKey: expect.any(Buffer),
            counter: 5,
            transports: ['internal'],
          }),
        }),
      );

      // Counter update
      expect(mockDbRef.update).toHaveBeenCalledWith(expect.objectContaining({
        counter: 6,
        lastUsedAt: expect.any(Number),
      }));
    });

    it('resolves uid via owner index when challenge has no uid', async () => {
      mockConsumeChallenge.mockResolvedValue({ challenge: 'c', uid: null, email: null });
      // First once: owner lookup, second: credential lookup, third: getUser
      mockDbRef.once
        .mockResolvedValueOnce(snap({ uid: 'u1' }))
        .mockResolvedValueOnce(snap({ publicKey: publicKeyB64url, counter: 0 }));
      mockAuthAdmin.getUser.mockResolvedValue({ email: 'x@y.z' });
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 0 },
      });

      const res = makeRes();
      await capturedHandler(makeReq('POST', {
        challengeKey: 'k',
        assertionResponse: { id: credentialId },
      }), res);

      expect(mockAuthAdmin.createCustomToken).toHaveBeenCalledWith('u1', { email: 'x@y.z' });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('rejects when counter does not strictly increase', async () => {
      mockConsumeChallenge.mockResolvedValue({ challenge: 'c', uid: 'u1', email: 'a@b.c' });
      mockDbRef.once.mockResolvedValueOnce(snap({
        publicKey: publicKeyB64url,
        counter: 5,
      }));
      mockVerifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 5 },
      });

      const res = makeRes();
      await capturedHandler(makeReq('POST', {
        challengeKey: 'k',
        assertionResponse: { id: credentialId },
      }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockAuthAdmin.createCustomToken).not.toHaveBeenCalled();
    });

    it('returns 400 when verify rejects', async () => {
      mockConsumeChallenge.mockResolvedValue({ challenge: 'c', uid: 'u1', email: 'a@b.c' });
      mockDbRef.once.mockResolvedValueOnce(snap({ publicKey: publicKeyB64url, counter: 0 }));
      mockVerifyAuthenticationResponse.mockRejectedValue(new Error('bad sig'));
      const res = makeRes();
      await capturedHandler(makeReq('POST', {
        challengeKey: 'k',
        assertionResponse: { id: credentialId },
      }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when verify returns not verified', async () => {
      mockConsumeChallenge.mockResolvedValue({ challenge: 'c', uid: 'u1', email: 'a@b.c' });
      mockDbRef.once.mockResolvedValueOnce(snap({ publicKey: publicKeyB64url, counter: 0 }));
      mockVerifyAuthenticationResponse.mockResolvedValue({ verified: false });
      const res = makeRes();
      await capturedHandler(makeReq('POST', {
        challengeKey: 'k',
        assertionResponse: { id: credentialId },
      }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
