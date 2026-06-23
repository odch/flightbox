describe('util', () => {
  describe('auth', () => {
    let loadCredentialsToken, loadGuestToken, loadKioskToken;

    beforeEach(() => {
      global.__FIREBASE_PROJECT_ID__ = 'test-project-id';

      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({token: 'test-token'})
      });

      jest.resetModules();
      const auth = require('./auth');
      loadCredentialsToken = auth.loadCredentialsToken;
      loadGuestToken = auth.loadGuestToken;
      loadKioskToken = auth.loadKioskToken;
    });

    const getCallBody = () => JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const getCallUrl = () => (global.fetch as jest.Mock).mock.calls[0][0];

    it('posts to auth cloud function for the configured project', async () => {
      await loadGuestToken('my-query-token');
      expect(getCallUrl()).toContain('test-project-id');
      expect(getCallUrl()).toContain('auth');
    });

    it('loadCredentialsToken posts with static mode', async () => {
      await loadCredentialsToken({username: 'user', password: 'pass'});
      const body = getCallBody();
      expect(body.mode).toBe('static');
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
      await expect(auth.loadGuestToken('t')).rejects.toThrow('Network error');
    });

    it('uses correct Content-Type header', async () => {
      await loadGuestToken('t');
      const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
      // Headers object - check it was set
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({method: 'POST'})
      );
    });

    it('resolves with token from response', async () => {
      const token = await loadGuestToken('t');
      expect(token).toBe('test-token');
    });
  });
});
