describe('functions', () => {
  describe('auth/generateSignInLink', () => {
    let mockAdmin;
    let mockFunctions;
    let capturedHandler;
    let mockCors;

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;

      mockAdmin = {
        auth: jest.fn().mockReturnValue({
          generateSignInWithEmailLink: jest.fn()
        })
      };

      mockCors = jest.fn().mockImplementation((req, res, cb) => cb());

      mockFunctions = {
        https: {
          onRequest: jest.fn().mockImplementation(handler => { capturedHandler = handler; })
        }
      };
      mockFunctions.region = jest.fn(() => mockFunctions);

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('firebase-functions', () => mockFunctions);
      jest.mock('cors', () => () => mockCors);

      require('./generateSignInLink');
    });

    const makeReq = (method, body) => ({ method, body });
    const makeRes = () => ({
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    });

    it('returns 405 for non-POST request', async () => {
      const req = makeReq('GET', {});
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('returns 400 when email is missing', async () => {
      const req = makeReq('POST', { continueUrl: 'https://example.com' });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email is required' });
    });

    it('returns 400 when continueUrl is missing', async () => {
      const req = makeReq('POST', { email: 'user@example.com' });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Continue URL is required' });
    });

    it('returns 400 when email format is invalid', async () => {
      const req = makeReq('POST', { email: 'notanemail', continueUrl: 'https://example.com' });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email format' });
    });

    it('generates sign-in link and returns 200 on success', async () => {
      mockAdmin.auth().generateSignInWithEmailLink.mockResolvedValue('https://sign-in-link.example.com');
      const req = makeReq('POST', { email: 'user@example.com', continueUrl: 'https://app.example.com' });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        signInLink: 'https://sign-in-link.example.com',
        email: 'user@example.com'
      });
    });

    it('calls generateSignInWithEmailLink with correct params', async () => {
      mockAdmin.auth().generateSignInWithEmailLink.mockResolvedValue('https://link');
      const req = makeReq('POST', { email: 'user@example.com', continueUrl: 'https://app.example.com' });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(mockAdmin.auth().generateSignInWithEmailLink).toHaveBeenCalledWith(
        'user@example.com',
        { url: 'https://app.example.com', handleCodeInApp: true }
      );
    });

    it('returns 500 when generateSignInWithEmailLink throws', async () => {
      mockAdmin.auth().generateSignInWithEmailLink.mockRejectedValue(new Error('Auth error'));
      const req = makeReq('POST', { email: 'user@example.com', continueUrl: 'https://app.example.com' });
      const res = makeRes();
      await capturedHandler(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Failed to generate sign-in link'
      }));
    });
  });
});
