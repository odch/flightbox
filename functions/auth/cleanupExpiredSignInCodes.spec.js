describe('functions', () => {
  describe('auth/cleanupExpiredSignInCodes', () => {
    let mockAdmin;
    let capturedHandler;
    let capturedOptions;
    let mockCodesRef;
    let mockRateLimitsRef;

    const now = Date.now();

    const emptySnapshot = { exists: () => false, forEach: () => {} };

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;
      capturedOptions = null;

      mockCodesRef = {
        once: jest.fn().mockResolvedValue(emptySnapshot),
        update: jest.fn().mockResolvedValue(undefined),
      };
      mockRateLimitsRef = {
        once: jest.fn().mockResolvedValue(emptySnapshot),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockAdmin = {
        database: jest.fn().mockReturnValue({
          ref: jest.fn(path => path === '/signInRateLimits' ? mockRateLimitsRef : mockCodesRef)
        })
      };

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('firebase-functions/v2/scheduler', () => ({
        onSchedule: jest.fn((opts, handler) => {
          capturedOptions = opts;
          capturedHandler = handler;
        })
      }));

      require('./cleanupExpiredSignInCodes');
    });

    const makeSnapshot = (entries) => ({
      exists: () => entries.length > 0,
      forEach: (cb) => entries.forEach(({ key, val }) => cb({ key, val: () => val })),
    });

    it('does nothing when no codes exist', async () => {
      mockCodesRef.once.mockResolvedValue(makeSnapshot([]));
      await capturedHandler();
      expect(mockCodesRef.update).not.toHaveBeenCalled();
    });

    it('deletes expired codes', async () => {
      const snapshot = makeSnapshot([
        { key: 'k1', val: { expiry: now - 1000 } },
        { key: 'k2', val: { expiry: now - 5000 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);

      await capturedHandler();

      expect(mockCodesRef.update).toHaveBeenCalledWith({ k1: null, k2: null });
    });

    it('keeps non-expired codes', async () => {
      const snapshot = makeSnapshot([
        { key: 'k1', val: { expiry: now + 60000 } },
        { key: 'k2', val: { expiry: now + 600000 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);

      await capturedHandler();

      expect(mockCodesRef.update).not.toHaveBeenCalled();
    });

    it('only deletes expired codes when mix of expired and non-expired', async () => {
      const snapshot = makeSnapshot([
        { key: 'k1', val: { expiry: now - 1000 } },
        { key: 'k2', val: { expiry: now + 60000 } },
        { key: 'k3', val: { expiry: now - 5000 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);

      await capturedHandler();

      expect(mockCodesRef.update).toHaveBeenCalledWith({ k1: null, k3: null });
    });

    it('deletes exhausted codes (attempts >= 5) that have not yet expired', async () => {
      const snapshot = makeSnapshot([
        { key: 'k1', val: { expiry: now + 60000, attempts: 5 } },
        { key: 'k2', val: { expiry: now + 60000, attempts: 6 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);

      await capturedHandler();

      expect(mockCodesRef.update).toHaveBeenCalledWith({ k1: null, k2: null });
    });

    it('keeps non-exhausted non-expired codes', async () => {
      const snapshot = makeSnapshot([
        { key: 'k1', val: { expiry: now + 60000, attempts: 4 } },
        { key: 'k2', val: { expiry: now + 60000, attempts: 0 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);

      await capturedHandler();

      expect(mockCodesRef.update).not.toHaveBeenCalled();
    });

    it('deletes both expired and exhausted codes in one pass', async () => {
      const snapshot = makeSnapshot([
        { key: 'k1', val: { expiry: now - 1000, attempts: 0 } },
        { key: 'k2', val: { expiry: now + 60000, attempts: 5 } },
        { key: 'k3', val: { expiry: now + 60000, attempts: 2 } },
      ]);
      mockCodesRef.once.mockResolvedValue(snapshot);

      await capturedHandler();

      expect(mockCodesRef.update).toHaveBeenCalledWith({ k1: null, k2: null });
    });

    it('deletes rate-limit entries older than the window and keeps recent ones', async () => {
      mockRateLimitsRef.once.mockResolvedValue(makeSnapshot([
        { key: 'rl1', val: { windowStart: now - (61 * 60 * 1000) } }, // stale (> 1h)
        { key: 'rl2', val: { windowStart: now - (10 * 60 * 1000) } }, // recent
      ]));

      await capturedHandler();

      expect(mockRateLimitsRef.update).toHaveBeenCalledWith({ rl1: null });
    });

    it('does not touch rate-limit entries that are all recent', async () => {
      mockRateLimitsRef.once.mockResolvedValue(makeSnapshot([
        { key: 'rl1', val: { windowStart: now - (5 * 60 * 1000) } },
      ]));

      await capturedHandler();

      expect(mockRateLimitsRef.update).not.toHaveBeenCalled();
    });

    it('is scheduled to run every 60 minutes', () => {
      expect(capturedOptions.schedule).toBe('every 60 minutes');
    });
  });
});
