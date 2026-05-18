describe('functions', () => {
  describe('auth/removePasskey', () => {
    let mockAdmin;
    let mockCors;
    let capturedHandler;
    let mockDbRef;
    let mockVerifyRecentAuth;

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;

      mockCors = jest.fn().mockImplementation((req, res, cb) => cb());

      mockDbRef = {
        child: jest.fn().mockReturnThis(),
        once: jest.fn(),
        remove: jest.fn().mockResolvedValue(undefined),
      };

      mockAdmin = {
        database: jest.fn().mockReturnValue({ ref: jest.fn().mockReturnValue(mockDbRef) }),
      };

      mockVerifyRecentAuth = jest.fn();

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('firebase-functions/v2/https', () => ({
        onRequest: (opts, handler) => { capturedHandler = handler; },
      }));
      jest.mock('cors', () => () => mockCors);
      jest.mock('./webauthnHelpers', () => {
        class AuthError extends Error {
          constructor(m) { super(m); this.name = 'AuthError'; }
        }
        return {
          AuthError,
          verifyAuthenticatedUser: mockVerifyRecentAuth,
        };
      });

      require('./removePasskey');
    });

    const makeReq = (method, body = {}) => ({ method, headers: { authorization: 'Bearer x' }, body });
    const makeRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
    const snap = (val) => ({ exists: () => val !== null && val !== undefined, val: () => val });

    it('returns 405 on GET', async () => {
      const res = makeRes();
      await capturedHandler(makeReq('GET'), res);
      expect(res.status).toHaveBeenCalledWith(405);
    });

    it('returns 401 on auth error', async () => {
      const { AuthError } = require('./webauthnHelpers');
      mockVerifyRecentAuth.mockRejectedValue(new AuthError('missing'));
      const res = makeRes();
      await capturedHandler(makeReq('POST', { credentialId: 'c' }), res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 when credentialId missing', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1' });
      const res = makeRes();
      await capturedHandler(makeReq('POST', {}), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 404 when credential not found', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1' });
      mockDbRef.once.mockResolvedValue(snap(null));
      const res = makeRes();
      await capturedHandler(makeReq('POST', { credentialId: 'c' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 if owner index points to different uid', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1' });
      mockDbRef.once
        .mockResolvedValueOnce(snap({ publicKey: 'x' })) // credential exists
        .mockResolvedValueOnce(snap({ uid: 'u2' })); // owner mismatch
      const res = makeRes();
      await capturedHandler(makeReq('POST', { credentialId: 'c' }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('removes credential and owner on success', async () => {
      mockVerifyRecentAuth.mockResolvedValue({ uid: 'u1' });
      mockDbRef.once
        .mockResolvedValueOnce(snap({ publicKey: 'x' }))
        .mockResolvedValueOnce(snap({ uid: 'u1' }));
      const res = makeRes();
      await capturedHandler(makeReq('POST', { credentialId: 'c' }), res);
      expect(mockDbRef.remove).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });
});
