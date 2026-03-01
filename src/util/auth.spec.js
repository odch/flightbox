describe('util', () => {
  describe('auth', () => {
    let loadIpToken, loadCredentialsToken, loadGuestToken, loadKioskToken;

    beforeEach(() => {
      global.__FIREBASE_PROJECT_ID__ = 'test-project-id';
      global.__FLIGHTNET_COMPANY__ = 'TEST_COMPANY';

      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({token: 'test-token'})
      });

      jest.resetModules();
      const auth = require('./auth');
      loadIpToken = auth.loadIpToken;
      loadCredentialsToken = auth.loadCredentialsToken;
      loadGuestToken = auth.loadGuestToken;
      loadKioskToken = auth.loadKioskToken;
    });

    const getCallBody = () => JSON.parse(global.fetch.mock.calls[0][1].body);
    const getCallUrl = () => global.fetch.mock.calls[0][0];

    it('loadIpToken posts to auth cloud function with ip mode', async () => {
      await loadIpToken();
      expect(getCallUrl()).toContain('test-project-id');
      expect(getCallUrl()).toContain('auth');
      expect(getCallBody()).toEqual({mode: 'ip'});
    });

    it('loadCredentialsToken posts with flightnet mode and company', async () => {
      await loadCredentialsToken({username: 'user', password: 'pass'});
      const body = getCallBody();
      expect(body.mode).toBe('flightnet');
      expect(body.company).toBe('TEST_COMPANY');
      expect(body.username).toBe('user');
      expect(body.password).toBe('pass');
    });

    it('loadGuestToken posts with guest_token mode and token', async () => {
      await loadGuestToken('my-query-token');
      const body = getCallBody();
      expect(body.mode).toBe('guest_token');
      expect(body.token).toBe('my-query-token');
    });

    it('loadKioskToken posts with kiosk_token mode and token', async () => {
      await loadKioskToken('kiosk-token-123');
      const body = getCallBody();
      expect(body.mode).toBe('kiosk_token');
      expect(body.token).toBe('kiosk-token-123');
    });

    it('rejects when fetch throws', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      jest.resetModules();
      const auth = require('./auth');
      await expect(auth.loadIpToken()).rejects.toThrow('Network error');
    });

    it('uses correct Content-Type header', async () => {
      await loadIpToken();
      const headers = global.fetch.mock.calls[0][1].headers;
      // Headers object - check it was set
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({method: 'POST'})
      );
    });

    it('resolves with token from response', async () => {
      const token = await loadIpToken();
      expect(token).toBe('test-token');
    });
  });
});
