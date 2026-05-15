describe('functions', () => {
  describe('auth/webauthnHelpers', () => {
    let mockAdmin;
    let mockChallengesRef;
    let mockAuthAdmin;
    let helpers;

    beforeEach(() => {
      jest.resetModules();

      mockChallengesRef = {
        child: jest.fn().mockReturnThis(),
        set: jest.fn().mockResolvedValue(undefined),
        transaction: jest.fn(),
      };

      mockAuthAdmin = {
        verifyIdToken: jest.fn(),
      };

      mockAdmin = {
        database: jest.fn().mockReturnValue({
          ref: jest.fn().mockReturnValue(mockChallengesRef),
        }),
        auth: jest.fn().mockReturnValue(mockAuthAdmin),
      };

      jest.mock('firebase-admin', () => mockAdmin);

      process.env.WEBAUTHN_RPID = 'flightbox.ch';
      process.env.WEBAUTHN_RPNAME = 'Flightbox';
      process.env.WEBAUTHN_ORIGINS = 'https://flightbox.ch,https://www.flightbox.ch';

      helpers = require('./webauthnHelpers');
    });

    afterEach(() => {
      delete process.env.WEBAUTHN_RPID;
      delete process.env.WEBAUTHN_RPNAME;
      delete process.env.WEBAUTHN_ORIGINS;
    });

    describe('getRpConfig', () => {
      it('returns parsed RP config', () => {
        const cfg = helpers.getRpConfig();
        expect(cfg.rpID).toBe('flightbox.ch');
        expect(cfg.rpName).toBe('Flightbox');
        expect(cfg.expectedOrigins).toEqual(['https://flightbox.ch', 'https://www.flightbox.ch']);
      });

      it('trims whitespace around CSV origins', () => {
        process.env.WEBAUTHN_ORIGINS = 'https://a , https://b';
        const cfg = helpers.getRpConfig();
        expect(cfg.expectedOrigins).toEqual(['https://a', 'https://b']);
      });

      it('defaults rpName to "Flightbox" when unset', () => {
        delete process.env.WEBAUTHN_RPNAME;
        const cfg = helpers.getRpConfig();
        expect(cfg.rpName).toBe('Flightbox');
      });

      it('throws if WEBAUTHN_RPID is missing', () => {
        delete process.env.WEBAUTHN_RPID;
        expect(() => helpers.getRpConfig()).toThrow(/WEBAUTHN_RPID/);
      });

      it('throws if WEBAUTHN_ORIGINS is missing', () => {
        delete process.env.WEBAUTHN_ORIGINS;
        expect(() => helpers.getRpConfig()).toThrow(/WEBAUTHN_ORIGINS/);
      });
    });

    describe('persistChallenge', () => {
      it('writes record with expiry and returns key', async () => {
        const key = await helpers.persistChallenge({
          type: 'registration',
          challenge: 'chal',
          uid: 'u1',
          email: 'a@b.c',
        });
        expect(typeof key).toBe('string');
        expect(key.length).toBeGreaterThan(10);
        expect(mockChallengesRef.child).toHaveBeenCalledWith(key);
        expect(mockChallengesRef.set).toHaveBeenCalledWith(expect.objectContaining({
          type: 'registration',
          challenge: 'chal',
          uid: 'u1',
          email: 'a@b.c',
          attempts: 0,
        }));
        const record = mockChallengesRef.set.mock.calls[0][0];
        expect(record.expiry).toBeGreaterThan(Date.now());
      });

      it('accepts null uid/email', async () => {
        await helpers.persistChallenge({ type: 'authentication', challenge: 'c' });
        const record = mockChallengesRef.set.mock.calls[0][0];
        expect(record.uid).toBeNull();
        expect(record.email).toBeNull();
      });
    });

    describe('consumeChallenge', () => {
      const mockTransactionWith = (currentValue) => {
        mockChallengesRef.transaction.mockImplementation(async (updateFn) => {
          const ret = updateFn(currentValue);
          return { committed: ret !== undefined, snapshot: {} };
        });
      };

      it('atomically claims the record and returns it on happy path', async () => {
        const record = { type: 'registration', challenge: 'c', expiry: Date.now() + 60000, uid: 'u1' };
        mockTransactionWith(record);
        const out = await helpers.consumeChallenge('k', 'registration');
        expect(out).toEqual(record);
        expect(mockChallengesRef.transaction).toHaveBeenCalled();
        const updateFn = mockChallengesRef.transaction.mock.calls[0][0];
        expect(updateFn(record)).toBeNull();
        // On the initial cached-null call, we must return null (not undefined)
        // so the transaction retries instead of aborting.
        expect(updateFn(null)).toBeNull();
      });

      it('throws when challenge missing', async () => {
        mockTransactionWith(null);
        await expect(helpers.consumeChallenge('k', 'registration')).rejects.toThrow(/not found/);
      });

      it('throws and claims on wrong type', async () => {
        mockTransactionWith({
          type: 'authentication', challenge: 'c', expiry: Date.now() + 60000,
        });
        await expect(helpers.consumeChallenge('k', 'registration')).rejects.toThrow(/type/);
        expect(mockChallengesRef.transaction).toHaveBeenCalled();
      });

      it('throws and claims on expired challenge', async () => {
        mockTransactionWith({
          type: 'registration', challenge: 'c', expiry: Date.now() - 1,
        });
        await expect(helpers.consumeChallenge('k', 'registration')).rejects.toThrow(/expired/);
        expect(mockChallengesRef.transaction).toHaveBeenCalled();
      });

      it('throws on invalid key', async () => {
        await expect(helpers.consumeChallenge('', 'registration')).rejects.toThrow();
      });
    });

    describe('verifyAuthenticatedUser', () => {
      const makeReq = (header) => ({ headers: header ? { authorization: header } : {} });

      it('throws AuthError when header missing', async () => {
        await expect(helpers.verifyAuthenticatedUser(makeReq(null))).rejects.toBeInstanceOf(helpers.AuthError);
      });

      it('throws AuthError on malformed header', async () => {
        await expect(helpers.verifyAuthenticatedUser(makeReq('Basic xyz'))).rejects.toBeInstanceOf(helpers.AuthError);
      });

      it('throws when verifyIdToken rejects', async () => {
        mockAuthAdmin.verifyIdToken.mockRejectedValue(new Error('bad'));
        await expect(helpers.verifyAuthenticatedUser(makeReq('Bearer xyz'))).rejects.toBeInstanceOf(helpers.AuthError);
      });

      it('returns uid and email on valid token', async () => {
        mockAuthAdmin.verifyIdToken.mockResolvedValue({ uid: 'u1', email: 'a@b.c' });
        const out = await helpers.verifyAuthenticatedUser(makeReq('Bearer xyz'));
        expect(out).toEqual({ uid: 'u1', email: 'a@b.c' });
        expect(mockAuthAdmin.verifyIdToken).toHaveBeenCalledWith('xyz', true);
      });
    });
  });
});
