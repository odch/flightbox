describe('functions', () => {
  describe('auth/cleanupExpiredWebauthnChallenges', () => {
    let mockAdmin;
    let capturedHandler;
    let capturedOptions;
    let mockChallengesRef;

    const now = Date.now();

    beforeEach(() => {
      jest.resetModules();
      capturedHandler = null;
      capturedOptions = null;

      // The cleanup reads only expired records via an indexed range query:
      //   ref.orderByChild('expiry').endAt(now).once('value')
      // orderByChild/endAt are chainable (return the same ref); once resolves
      // the (already-filtered) snapshot.
      mockChallengesRef = {
        orderByChild: jest.fn().mockReturnThis(),
        endAt: jest.fn().mockReturnThis(),
        once: jest.fn(),
        update: jest.fn().mockResolvedValue(undefined),
      };

      mockAdmin = {
        database: jest.fn().mockReturnValue({
          ref: jest.fn().mockReturnValue(mockChallengesRef)
        })
      };

      jest.mock('firebase-admin', () => mockAdmin);
      jest.mock('firebase-functions/v2/scheduler', () => ({
        onSchedule: jest.fn((opts, handler) => {
          capturedOptions = opts;
          capturedHandler = handler;
        })
      }));

      require('./cleanupExpiredWebauthnChallenges');
    });

    // The snapshot represents what the `endAt(now)` query returned — i.e. the
    // already-expired records. The handler deletes exactly these.
    const makeSnapshot = (entries) => ({
      exists: () => entries.length > 0,
      forEach: (cb) => entries.forEach(({ key, val }) => cb({ key, val: () => val })),
    });

    it('queries the expiry index for records up to now', async () => {
      mockChallengesRef.once.mockResolvedValue(makeSnapshot([]));
      await capturedHandler();

      expect(mockChallengesRef.orderByChild).toHaveBeenCalledWith('expiry');
      const endAtArg = mockChallengesRef.endAt.mock.calls[0][0];
      expect(typeof endAtArg).toBe('number');
      // Bound is "now" — within a small window of the test clock.
      expect(Math.abs(endAtArg - now)).toBeLessThan(60000);
    });

    it('does nothing when no expired challenges are returned', async () => {
      mockChallengesRef.once.mockResolvedValue(makeSnapshot([]));
      await capturedHandler();
      expect(mockChallengesRef.update).not.toHaveBeenCalled();
    });

    it('deletes every record the expired-query returns', async () => {
      mockChallengesRef.once.mockResolvedValue(makeSnapshot([
        { key: 'k1', val: { expiry: now - 1000 } },
        { key: 'k2', val: { expiry: now - 5000 } },
      ]));
      await capturedHandler();
      expect(mockChallengesRef.update).toHaveBeenCalledWith({ k1: null, k2: null });
    });

    it('removes stale records with missing expiry (returned by the range query)', async () => {
      // endAt(now) also returns records whose `expiry` is missing/null (they
      // sort before numbers); they are stale and get deleted.
      mockChallengesRef.once.mockResolvedValue(makeSnapshot([
        { key: 'k1', val: {} },
        { key: 'k2', val: { expiry: now - 1 } },
      ]));
      await capturedHandler();
      expect(mockChallengesRef.update).toHaveBeenCalledWith({ k1: null, k2: null });
    });

    it('runs hourly', () => {
      expect(capturedOptions.schedule).toBe('every 60 minutes');
    });
  });
});
