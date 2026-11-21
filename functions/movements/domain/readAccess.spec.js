'use strict';

const { readAccess } = require('./readAccess');

const PERSONAL = { personalAccess: true };
const SHARED = { personalAccess: false };
const PILOT = { uid: 'pilot-uid', email: 'pilot@example.com' };
const LOGIN = { uid: 'login:sub-1', email: 'admin@example.com', scopes: ['movements:read'] };
const facts = (overrides = {}) => ({ appUid: null, admin: false, allMovements: false, ...overrides });

describe('movement domain', () => {
  describe('readAccess', () => {
    it('lets everyone list all where access is shared, as themselves', () => {
      expect(readAccess(PILOT, SHARED, facts())).toEqual({ all: true, uid: 'pilot-uid' });
    });

    it('lets admins and allMovements operators list all, as their app user', () => {
      expect(readAccess(PILOT, PERSONAL, facts({ appUid: 'pilot-uid', admin: true }))).toEqual({ all: true, uid: 'pilot-uid' });
      expect(readAccess(LOGIN, PERSONAL, facts({ appUid: 'admin-uid', allMovements: true }))).toEqual({ all: true, uid: 'admin-uid' });
    });

    it('gives pilots their own movements, as themselves', () => {
      expect(readAccess(PILOT, PERSONAL, facts({ appUid: 'pilot-uid' }))).toEqual({ all: false, uid: 'pilot-uid' });
      expect(readAccess(LOGIN, PERSONAL, facts({ appUid: 'other-uid' }))).toEqual({ all: false, uid: 'login:sub-1' });
    });

    it('needs an app user for the rights (a login caller without one is a pilot)', () => {
      expect(readAccess(LOGIN, PERSONAL, facts({ appUid: null, admin: true }))).toEqual({ all: false, uid: 'login:sub-1' });
      expect(readAccess(LOGIN, PERSONAL, facts({ appUid: '', admin: true })).all).toBe(false);
    });

    it('counts only true entries', () => {
      expect(readAccess(PILOT, PERSONAL, facts({ appUid: 'pilot-uid', admin: 'true', allMovements: 1 })).all).toBe(false);
    });
  });
});
