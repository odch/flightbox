import { getPprAccess, pprEnabled, pprGuestRequestsEnabled } from './access';

const VISITOR = { authenticated: false };
const MEMBER = { authenticated: true, data: { uid: 'u1', email: 'pilot@example.com', guest: false, kiosk: false } };
const GUEST_SESSION = { authenticated: true, data: { uid: 'guest', email: null, guest: true, kiosk: false } };
const WITHOUT_EMAIL = { authenticated: true, data: { uid: 'tower', email: null, guest: false, kiosk: false } };
const KIOSK = { authenticated: true, data: { uid: 'kiosk', email: null, guest: false, kiosk: true } };

describe('modules', () => {
  describe('ppr', () => {
    describe('access', () => {
      afterEach(() => {
        delete (global as any).__CONF__;
      });

      describe('pprEnabled', () => {
        it('is on where the project turns PPR on', () => {
          (global as any).__CONF__ = { ppr: true };
          expect(pprEnabled()).toBe(true);
        });

        it.each([[{ ppr: false }], [{ ppr: 'true' }], [{}]])('is off for %j', conf => {
          (global as any).__CONF__ = conf;
          expect(pprEnabled()).toBe(false);
        });

        it('is off without a configuration', () => {
          expect(pprEnabled()).toBe(false);
        });
      });

      describe('pprGuestRequestsEnabled', () => {
        it('is on where the project turns PPR and requests without login on', () => {
          (global as any).__CONF__ = { ppr: true, pprGuestRequests: true };
          expect(pprGuestRequestsEnabled()).toBe(true);
        });

        it('is off without PPR, as on the server', () => {
          (global as any).__CONF__ = { ppr: false, pprGuestRequests: true };
          expect(pprGuestRequestsEnabled()).toBe(false);
        });

        it.each([[false], ['true'], [undefined]])('is off for pprGuestRequests %p', pprGuestRequests => {
          (global as any).__CONF__ = { ppr: true, pprGuestRequests };
          expect(pprGuestRequestsEnabled()).toBe(false);
        });

        it('is off without a configuration', () => {
          expect(pprGuestRequestsEnabled()).toBe(false);
        });
      });

      describe('getPprAccess', () => {
        describe('with requests without login', () => {
          beforeEach(() => {
            (global as any).__CONF__ = { ppr: true, pprGuestRequests: true };
          });

          it.each([
            ['nobody logged in', VISITOR, 'visitor'],
            ['a login with an email address', MEMBER, 'member'],
            ['a guest session', GUEST_SESSION, 'guest'],
            ['a login without an email address', WITHOUT_EMAIL, 'guest'],
            ['the kiosk', KIOSK, 'kiosk'],
          ])('gives %s %s', (_, auth, access) => {
            expect(getPprAccess(auth)).toBe(access);
          });

          it('treats a guest session as a guest, also with an email address', () => {
            const auth = { authenticated: true, data: { ...GUEST_SESSION.data, email: 'guest@example.com' } };
            expect(getPprAccess(auth)).toBe('guest');
          });

          it('treats a login whose data has not arrived as one without an email address', () => {
            expect(getPprAccess({ authenticated: true })).toBe('guest');
          });

          it('ignores the data of a login that has ended', () => {
            expect(getPprAccess({ authenticated: false, data: MEMBER.data })).toBe('visitor');
          });
        });

        describe('without requests without login', () => {
          beforeEach(() => {
            (global as any).__CONF__ = { ppr: true };
          });

          it.each([
            ['nobody logged in', VISITOR, 'visitor'],
            ['a login with an email address', MEMBER, 'member'],
            ['a guest session', GUEST_SESSION, 'none'],
            ['a login without an email address', WITHOUT_EMAIL, 'none'],
            ['the kiosk', KIOSK, 'kiosk'],
          ])('gives %s %s', (_, auth, access) => {
            expect(getPprAccess(auth)).toBe(access);
          });
        });

        it.each([VISITOR, MEMBER, GUEST_SESSION, KIOSK])('gives no access without PPR (%j)', auth => {
          (global as any).__CONF__ = { ppr: false, pprGuestRequests: true };
          expect(getPprAccess(auth)).toBe('none');
        });
      });
    });
  });
});
