'use strict';

const captured = {};

jest.mock('firebase-functions/v2/database', () => ({
  onValueWritten: jest.fn((opts, handler) => {
    // Register handlers by their ref so tests can invoke the right one.
    captured[opts.ref] = handler;
    return handler;
  }),
}));

jest.mock('firebase-functions/v2', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

jest.mock('firebase-functions/params', () => ({
  defineString: jest.fn((name, opts) => ({ name, ...(opts || {}) })),
}));

const mockRevokeRefreshTokens = jest.fn().mockResolvedValue(undefined);

jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({ revokeRefreshTokens: mockRevokeRefreshTokens })),
}));

require('./revokeSharedSessionsOnTokenRotation');

const makeEvent = (before, after) => ({
  data: {
    before: { val: () => before },
    after: { val: () => after },
  },
});

describe('functions/auth/revokeSharedSessionsOnTokenRotation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('kiosk token rotation', () => {
    const run = event => captured['/settings/kioskAccessToken'](event);

    it('revokes the kiosk refresh tokens when the token changes', async () => {
      await run(makeEvent('old-token', 'new-token'));
      expect(mockRevokeRefreshTokens).toHaveBeenCalledTimes(1);
      expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('kiosk');
    });

    it('revokes when a token is first set (null -> value)', async () => {
      await run(makeEvent(null, 'new-token'));
      expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('kiosk');
    });

    it('revokes when the token is cleared (value -> null)', async () => {
      await run(makeEvent('old-token', null));
      expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('kiosk');
    });

    it('does not revoke when the token is unchanged', async () => {
      await run(makeEvent('same-token', 'same-token'));
      expect(mockRevokeRefreshTokens).not.toHaveBeenCalled();
    });
  });

  describe('guest token rotation', () => {
    const run = event => captured['/settings/guestAccessToken'](event);

    it('revokes the guest refresh tokens when the token changes', async () => {
      await run(makeEvent('old-token', 'new-token'));
      expect(mockRevokeRefreshTokens).toHaveBeenCalledTimes(1);
      expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('guest');
    });

    it('does not revoke when the token is unchanged', async () => {
      await run(makeEvent('same-token', 'same-token'));
      expect(mockRevokeRefreshTokens).not.toHaveBeenCalled();
    });
  });
});
