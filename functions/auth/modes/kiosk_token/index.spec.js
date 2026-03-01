describe('functions', () => {
  describe('auth/modes/kiosk_token', () => {
    let mockAdmin;
    let mockRequestHelper;
    let handler;

    beforeEach(() => {
      jest.resetModules();

      const mockOnce = jest.fn();

      mockAdmin = {
        database: jest.fn().mockReturnValue({
          ref: jest.fn().mockReturnValue({
            once: mockOnce
          })
        })
      };

      mockRequestHelper = {
        requireBodyProperty: jest.fn()
      };

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('../../util/requestHelper', () => mockRequestHelper);

      handler = require('./index');
    });

    it('resolves with "kiosk" when token matches', async () => {
      mockRequestHelper.requireBodyProperty.mockReturnValue('kiosk-secret');
      mockAdmin.database().ref().once.mockResolvedValue({ val: () => 'kiosk-secret' });

      const req = { body: { token: 'kiosk-secret' } };
      const result = await handler(req);
      expect(result).toBe('kiosk');
    });

    it('resolves with null when token does not match', async () => {
      mockRequestHelper.requireBodyProperty.mockReturnValue('bad-token');
      mockAdmin.database().ref().once.mockResolvedValue({ val: () => 'kiosk-secret' });

      const req = { body: { token: 'bad-token' } };
      const result = await handler(req);
      expect(result).toBeNull();
    });

    it('resolves with null when token is falsy', async () => {
      mockRequestHelper.requireBodyProperty.mockReturnValue('');
      mockAdmin.database().ref().once.mockResolvedValue({ val: () => 'kiosk-secret' });

      const req = { body: {} };
      const result = await handler(req);
      expect(result).toBeNull();
    });

    it('reads from /settings/kioskAccessToken path', async () => {
      mockRequestHelper.requireBodyProperty.mockReturnValue('token');
      mockAdmin.database().ref().once.mockResolvedValue({ val: () => 'token' });

      await handler({ body: {} });
      expect(mockAdmin.database().ref).toHaveBeenCalledWith('/settings/kioskAccessToken');
    });
  });
});
