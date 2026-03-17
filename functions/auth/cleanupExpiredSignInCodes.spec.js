describe('functions', () => {
  describe('auth/cleanupExpiredSignInCodes', () => {
    let mockAdmin;
    let mockFunctions;
    let capturedHandler;
    let mockCodesRef;

    const now = Date.now();

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;

      mockCodesRef = {
        once: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockAdmin = {
        database: jest.fn().mockReturnValue({
          ref: jest.fn().mockReturnValue(mockCodesRef)
        })
      };

      const mockSchedule = {
        onRun: jest.fn().mockImplementation(handler => { capturedHandler = handler; })
      };

      mockFunctions = {
        pubsub: {
          schedule: jest.fn().mockReturnValue(mockSchedule)
        }
      };
      mockFunctions.region = jest.fn(() => mockFunctions);

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('firebase-functions', () => mockFunctions);

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

    it('is scheduled to run every 60 minutes', () => {
      expect(mockFunctions.pubsub.schedule).toHaveBeenCalledWith('every 60 minutes');
    });
  });
});
