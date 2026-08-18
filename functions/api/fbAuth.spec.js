jest.mock('firebase-admin', () => ({
  auth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn()
  }),
  database: jest.fn().mockReturnValue({
    ref: jest.fn().mockReturnValue({
      once: jest.fn()
    })
  })
}));

const admin = require('firebase-admin');
const { fbAuth, fbAdminAuth, fbAuthExcludingShared } = require('./fbAuth');

describe('functions', () => {
  describe('api/fbAuth', () => {
    let req, res, next;

    beforeEach(() => {
      req = { headers: {} };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      next = jest.fn();
      jest.clearAllMocks();
    });

    describe('fbAuth', () => {
      it('returns 401 when no authorization header', async () => {
        req.headers = {};
        await fbAuth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith('Unauthorized');
        expect(next).not.toHaveBeenCalled();
      });

      it('returns 401 when authorization type is not Bearer', async () => {
        req.headers.authorization = 'Basic abc123';
        await fbAuth(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith('Unauthorized');
        expect(next).not.toHaveBeenCalled();
      });

      it('sets fbUserId and fbUserEmail then calls next on valid token', async () => {
        req.headers.authorization = 'Bearer valid-token';
        admin.auth().verifyIdToken.mockResolvedValue({ uid: 'user123', email: 'user@test.com' });

        await fbAuth(req, res, next);

        expect(admin.auth().verifyIdToken).toHaveBeenCalledWith('valid-token', true);
        expect(req.fbUserId).toBe('user123');
        expect(req.fbUserEmail).toBe('user@test.com');
        expect(next).toHaveBeenCalled();
      });

      it('returns 401 when token verification fails', async () => {
        req.headers.authorization = 'Bearer bad-token';
        admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

        await fbAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith('Unauthorized');
        expect(next).not.toHaveBeenCalled();
      });

      it('returns 401 when the token has been revoked', async () => {
        req.headers.authorization = 'Bearer revoked-token';
        const revokedError = new Error('Token revoked');
        revokedError.code = 'auth/id-token-revoked';
        admin.auth().verifyIdToken.mockRejectedValue(revokedError);

        await fbAuth(req, res, next);

        expect(admin.auth().verifyIdToken).toHaveBeenCalledWith('revoked-token', true);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith('Unauthorized');
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('fbAdminAuth', () => {
      it('returns 403 when user is not admin', async () => {
        req.headers.authorization = 'Bearer valid-token';
        req.fbUserId = 'user123';
        admin.auth().verifyIdToken.mockResolvedValue({ uid: 'user123', email: 'user@test.com' });
        admin.database().ref().once.mockResolvedValue({ val: () => false });

        await fbAdminAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      });

      it('calls next when user is admin', async () => {
        req.headers.authorization = 'Bearer valid-token';
        admin.auth().verifyIdToken.mockResolvedValue({ uid: 'user123', email: 'user@test.com' });
        admin.database().ref().once.mockResolvedValue({ val: () => true });

        await fbAdminAuth(req, res, next);

        expect(next).toHaveBeenCalled();
      });

      it('returns 500 when database check fails', async () => {
        req.headers.authorization = 'Bearer valid-token';
        admin.auth().verifyIdToken.mockResolvedValue({ uid: 'user123', email: 'user@test.com' });
        admin.database().ref().once.mockRejectedValue(new Error('DB error'));

        await fbAdminAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    describe('fbAuthExcludingShared', () => {
      it('calls next for a normal authenticated user', async () => {
        req.headers.authorization = 'Bearer valid-token';
        admin.auth().verifyIdToken.mockResolvedValue({ uid: 'user123', email: 'user@test.com' });

        await fbAuthExcludingShared(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalledWith(403);
      });

      it('returns 403 for a guest shared session', async () => {
        req.headers.authorization = 'Bearer valid-token';
        admin.auth().verifyIdToken.mockResolvedValue({ uid: 'guest', email: undefined });

        await fbAuthExcludingShared(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      });

      it('returns 403 for a kiosk shared session', async () => {
        req.headers.authorization = 'Bearer valid-token';
        admin.auth().verifyIdToken.mockResolvedValue({ uid: 'kiosk', email: undefined });

        await fbAuthExcludingShared(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
      });

      it('returns 401 (from fbAuth) when unauthenticated, without reaching the shared check', async () => {
        req.headers = {};

        await fbAuthExcludingShared(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
      });
    });
  });
});
