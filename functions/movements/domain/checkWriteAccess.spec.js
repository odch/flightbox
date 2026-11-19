'use strict';

const { checkWriteAccess, ONE_DAY_MS } = require('./checkWriteAccess');
const { REASONS, CODES } = require('./reasons');

const PERSONAL = { personalAccess: true, lockOnDateTime: false };
const SHARED = { personalAccess: false, lockOnDateTime: false };
const ISO_LOCK = { personalAccess: true, lockOnDateTime: true };

const PILOT = { uid: 'pilot-uid', email: 'pilot@example.com', isAdmin: false };
const GUEST = { uid: 'guest', email: null, isAdmin: false };
const ADMIN = { uid: 'admin-uid', email: null, isAdmin: true };

const DATE_TIME = '2026-06-16T10:00:00.000Z';

const movement = (overrides = {}) => ({
  dateTime: DATE_TIME,
  negativeTimestamp: -Date.parse(DATE_TIME),
  ...overrides,
});

const owned = (createdBy = PILOT.email, overrides) => movement({ createdBy, ...overrides });

const OK = { ok: true };
const NOT_OWNER = { ok: false, code: CODES.PERMISSION_DENIED, reason: REASONS.NOT_OWNER };
const UNAUTHENTICATED = { ok: false, code: CODES.PERMISSION_DENIED, reason: REASONS.UNAUTHENTICATED };
const LOCKED = { ok: false, code: CODES.FAILED_PRECONDITION, reason: REASONS.MOVEMENT_LOCKED };

describe('movement domain', () => {
  describe('checkWriteAccess', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['without uid', { email: 'pilot@example.com' }],
      ['with an empty uid', { uid: '' }],
      ['with a numeric uid', { uid: 1 }],
    ])('denies an actor that is %s', (label, actor) => {
      expect(checkWriteAccess({ actor, existing: null, next: owned(), policy: SHARED })).toEqual(UNAUTHENTICATED);
    });

    it('reports deleting a movement that does not exist', () => {
      expect(checkWriteAccess({ actor: ADMIN, existing: null, next: null, policy: SHARED }))
        .toEqual({ ok: false, code: CODES.FAILED_PRECONDITION, reason: REASONS.NOT_FOUND });
    });

    describe('ownership (personal access)', () => {
      it.each([
        ['pilot creates own', PILOT, null, owned(), OK],
        ['pilot creates for another owner', PILOT, null, owned('other@example.com'), NOT_OWNER],
        ['pilot creates ownerless', PILOT, null, movement(), NOT_OWNER],
        ['guest creates ownerless', GUEST, null, movement(), OK],
        ['guest creates owned', GUEST, null, owned(), NOT_OWNER],
        ['pilot updates own', PILOT, owned(), owned(), OK],
        ['pilot hands own movement to another owner', PILOT, owned(), owned('other@example.com'), NOT_OWNER],
        ['pilot claims another movement', PILOT, owned('other@example.com'), owned(), NOT_OWNER],
        ['pilot claims an ownerless movement', PILOT, movement(), owned(), NOT_OWNER],
        ['guest updates ownerless', GUEST, movement(), movement(), OK],
        ['guest claims an ownerless movement', GUEST, movement(), owned(), NOT_OWNER],
        ['guest updates owned', GUEST, owned(), owned(), NOT_OWNER],
        ['pilot deletes own', PILOT, owned(), null, OK],
        ['pilot deletes another', PILOT, owned('other@example.com'), null, NOT_OWNER],
        ['guest deletes ownerless', GUEST, movement(), null, NOT_OWNER],
        ['admin does anything', ADMIN, owned('other@example.com'), owned('x@example.com'), OK],
      ])('%s', (label, actor, existing, next, expected) => {
        expect(checkWriteAccess({ actor, existing, next, policy: PERSONAL })).toEqual(expected);
      });

      it('requires isAdmin to be exactly true', () => {
        const actor = { ...ADMIN, isAdmin: 'true' };
        expect(checkWriteAccess({ actor, existing: owned(), next: null, policy: PERSONAL })).toEqual(NOT_OWNER);
      });

      it('never matches an ownerless movement for an actor without e-mail', () => {
        const actor = { uid: 'phone-uid' };
        expect(checkWriteAccess({ actor, existing: movement(), next: movement(), policy: PERSONAL })).toEqual(NOT_OWNER);
        expect(checkWriteAccess({ actor, existing: movement({ createdBy: null }), next: null, policy: PERSONAL }))
          .toEqual(NOT_OWNER);
      });

      it('reads createdBy as an own property only, like a stored child', () => {
        const inherited = Object.setPrototypeOf(movement(), { createdBy: PILOT.email });
        expect(checkWriteAccess({ actor: PILOT, existing: inherited, next: owned(), policy: PERSONAL }))
          .toEqual(NOT_OWNER);
        expect(checkWriteAccess({ actor: GUEST, existing: movement(), next: inherited, policy: PERSONAL })).toEqual(OK);
      });

      it('lets any authenticated actor write on shared-access projects', () => {
        const actor = { uid: 'phone-uid' };
        expect(checkWriteAccess({ actor, existing: owned(), next: owned('x@example.com'), policy: SHARED })).toEqual(OK);
        expect(checkWriteAccess({ actor, existing: owned(), next: null, policy: SHARED })).toEqual(OK);
      });
    });

    describe('lock', () => {
      const lockDate = Date.parse('2026-06-10T00:00:00.000Z');
      const threshold = lockDate + ONE_DAY_MS;
      const at = timestamp => owned(PILOT.email, {
        dateTime: new Date(timestamp).toISOString(),
        negativeTimestamp: -timestamp,
      });
      const check = (existing, next, settings, policy = PERSONAL) =>
        checkWriteAccess({ actor: PILOT, existing, next, policy, settings });

      it('does not lock without a lock date', () => {
        expect(check(null, at(0 + 1000), {})).toEqual(OK);
        expect(check(null, at(1000), undefined)).toEqual(OK);
        expect(check(null, at(1000), null)).toEqual(OK);
        expect(check(null, at(1000), { lockDate: null, lockDateIso: '2030-01-01T00:00:00.000Z' })).toEqual(OK);
      });

      it('locks up to and including the end of the grace day', () => {
        expect(check(null, at(threshold), { lockDate })).toEqual(LOCKED);
        expect(check(null, at(threshold + 1), { lockDate })).toEqual(OK);
      });

      it('checks the stored and the next state of an update', () => {
        expect(check(at(threshold - 1), at(threshold + 1), { lockDate })).toEqual(LOCKED);
        expect(check(at(threshold + 1), at(threshold - 1), { lockDate })).toEqual(LOCKED);
        expect(check(at(threshold + 1), at(threshold + 2), { lockDate })).toEqual(OK);
      });

      it('checks the stored state of a delete', () => {
        expect(check(at(threshold), null, { lockDate })).toEqual(LOCKED);
        expect(check(at(threshold + 1), null, { lockDate })).toEqual(OK);
      });

      it('fails closed on a lock date or timestamp that is not a number', () => {
        expect(check(null, at(threshold + 1), { lockDate: String(lockDate) })).toEqual(LOCKED);
        expect(check(null, movement({ createdBy: PILOT.email, negativeTimestamp: undefined }), { lockDate }))
          .toEqual(LOCKED);
      });

      it('reads negativeTimestamp and dateTime as own properties only', () => {
        const inherited = Object.setPrototypeOf({ createdBy: PILOT.email }, at(threshold + 1));
        expect(check(null, inherited, { lockDate })).toEqual(LOCKED);
        expect(check(null, inherited, { lockDate, lockDateIso: new Date(threshold).toISOString() }, ISO_LOCK))
          .toEqual(LOCKED);
      });

      it('applies to admins too', () => {
        expect(checkWriteAccess({ actor: ADMIN, existing: null, next: at(threshold), policy: PERSONAL, settings: { lockDate } }))
          .toEqual(LOCKED);
      });

      it('checks ownership before the lock', () => {
        const other = { uid: 'other-uid', email: 'other@example.com' };
        expect(checkWriteAccess({ actor: other, existing: at(threshold), next: null, policy: PERSONAL, settings: { lockDate } }))
          .toEqual(NOT_OWNER);
        expect(checkWriteAccess({ actor: other, existing: at(threshold), next: null, policy: SHARED, settings: { lockDate } }))
          .toEqual(LOCKED);
      });

      describe('lockOnDateTime', () => {
        const lockDateIso = new Date(threshold).toISOString();

        it('compares dateTime with lockDateIso, not the numeric timestamp', () => {
          const backdated = owned(PILOT.email, { dateTime: '2026-06-01T00:00:00.000Z', negativeTimestamp: -(threshold + 1) });
          expect(check(null, backdated, { lockDate, lockDateIso }, ISO_LOCK)).toEqual(LOCKED);
          expect(check(null, backdated, { lockDate, lockDateIso }, PERSONAL)).toEqual(OK);
          expect(check(null, at(threshold + 1), { lockDate, lockDateIso }, ISO_LOCK)).toEqual(OK);
          expect(check(null, at(threshold), { lockDate, lockDateIso }, ISO_LOCK)).toEqual(LOCKED);
        });

        it('falls back to the numeric test while lockDateIso is absent', () => {
          expect(check(null, at(threshold), { lockDate }, ISO_LOCK)).toEqual(LOCKED);
          expect(check(null, at(threshold + 1), { lockDate }, ISO_LOCK)).toEqual(OK);
        });

        it('fails closed on a lockDateIso or dateTime that is not a string', () => {
          expect(check(null, at(threshold + 1), { lockDate, lockDateIso: threshold }, ISO_LOCK)).toEqual(LOCKED);
          expect(check(null, owned(PILOT.email, { dateTime: undefined }), { lockDate, lockDateIso }, ISO_LOCK))
            .toEqual(LOCKED);
        });
      });
    });

    it('returns frozen results', () => {
      expect(Object.isFrozen(checkWriteAccess({ actor: PILOT, existing: null, next: owned(), policy: PERSONAL }))).toBe(true);
      expect(Object.isFrozen(checkWriteAccess({ actor: null, policy: PERSONAL }))).toBe(true);
    });
  });
});
