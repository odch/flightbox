describe('functions', () => {
  describe('auth/cleanupExpiredWebauthnChallenges', () => {
    let mockAdmin;
    let mockFunctions;
    let capturedHandler;
    let mockChallengesRef;

    const now = Date.now();

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;

      mockChallengesRef = {
        once: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockAdmin = {
        database: jest.fn().mockReturnValue({
          ref: jest.fn().mockReturnValue(mockChallengesRef)
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

      require('./cleanupExpiredWebauthnChallenges');
    });

    const makeSnapshot = (entries) => ({
      exists: () => entries.length > 0,
      forEach: (cb) => entries.forEach(({ key, val }) => cb({ key, val: () => val })),
    });

    it('does nothing when no challenges exist', async () => {
      mockChallengesRef.once.mockResolvedValue(makeSnapshot([]));
      await capturedHandler();
      expect(mockChallengesRef.update).not.toHaveBeenCalled();
    });

    it('deletes expired challenges', async () => {
      mockChallengesRef.once.mockResolvedValue(makeSnapshot([
        { key: 'k1', val: { expiry: now - 1000 } },
        { key: 'k2', val: { expiry: now - 5000 } },
      ]));
      await capturedHandler();
      expect(mockChallengesRef.update).toHaveBeenCalledWith({ k1: null, k2: null });
    });

    it('keeps non-expired challenges', async () => {
      mockChallengesRef.once.mockResolvedValue(makeSnapshot([
        { key: 'k1', val: { expiry: now + 60000 } },
        { key: 'k2', val: { expiry: now + 600000 } },
      ]));
      await capturedHandler();
      expect(mockChallengesRef.update).not.toHaveBeenCalled();
    });

    it('only deletes expired when mixed with fresh', async () => {
      mockChallengesRef.once.mockResolvedValue(makeSnapshot([
        { key: 'k1', val: { expiry: now - 1000 } },
        { key: 'k2', val: { expiry: now + 60000 } },
        { key: 'k3', val: { expiry: now - 5000 } },
      ]));
      await capturedHandler();
      expect(mockChallengesRef.update).toHaveBeenCalledWith({ k1: null, k3: null });
    });

    it('deletes records with missing or non-numeric expiry', async () => {
      mockChallengesRef.once.mockResolvedValue(makeSnapshot([
        { key: 'k1', val: {} },
        { key: 'k2', val: { expiry: 'not-a-number' } },
        { key: 'k3', val: { expiry: now + 60000 } },
      ]));
      await capturedHandler();
      expect(mockChallengesRef.update).toHaveBeenCalledWith({ k1: null, k2: null });
    });

    it('is scheduled to run every 60 minutes', () => {
      expect(mockFunctions.pubsub.schedule).toHaveBeenCalledWith('every 60 minutes');
    });
  });
});
