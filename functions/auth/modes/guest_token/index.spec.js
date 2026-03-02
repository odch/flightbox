describe('functions', () => {
  describe('auth/modes/guest_token', () => {
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

    it('resolves with "guest" when token matches', async () => {
      mockRequestHelper.requireBodyProperty.mockReturnValue('secret-token');
      mockAdmin.database().ref().once.mockResolvedValue({ val: () => 'secret-token' });

      const req = { body: { token: 'secret-token' } };
      const result = await handler(req);
      expect(result).toBe('guest');
    });

    it('resolves with null when token does not match', async () => {
      mockRequestHelper.requireBodyProperty.mockReturnValue('wrong-token');
      mockAdmin.database().ref().once.mockResolvedValue({ val: () => 'secret-token' });

      const req = { body: { token: 'wrong-token' } };
      const result = await handler(req);
      expect(result).toBeNull();
    });

    it('resolves with null when token is not provided (falsy)', async () => {
      mockRequestHelper.requireBodyProperty.mockReturnValue(null);
      mockAdmin.database().ref().once.mockResolvedValue({ val: () => 'secret-token' });

      const req = { body: {} };
      const result = await handler(req);
      expect(result).toBeNull();
    });

    it('reads from /settings/guestAccessToken path', async () => {
      mockRequestHelper.requireBodyProperty.mockReturnValue('token');
      mockAdmin.database().ref().once.mockResolvedValue({ val: () => 'token' });

      await handler({ body: {} });
      expect(mockAdmin.database().ref).toHaveBeenCalledWith('/settings/guestAccessToken');
    });
  });
});
