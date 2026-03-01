import getAuthQueryToken, {getKioskAuthQueryToken, getGuestOnly} from './getAuthQueryToken';

describe('util', () => {
  describe('getAuthQueryToken', () => {
    it('returns token from location.state if present', () => {
      const location = {state: {queryToken: 'my-token'}, search: ''};
      expect(getAuthQueryToken(location)).toBe('my-token');
    });

    it('returns token from query param if it matches UUID pattern', () => {
      const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const location = {state: null, search: '?t=' + uuid};
      expect(getAuthQueryToken(location)).toBe(uuid);
    });

    it('returns null if query param does not match UUID pattern', () => {
      const location = {state: null, search: '?t=not-a-uuid'};
      expect(getAuthQueryToken(location)).toBeNull();
    });

    it('returns null if no state and no query param', () => {
      const location = {state: null, search: ''};
      expect(getAuthQueryToken(location)).toBeNull();
    });

    it('uses custom stateParamName', () => {
      const location = {state: {kioskQueryToken: 'kiosk-val'}, search: ''};
      expect(getAuthQueryToken(location, 'kt', 'kioskQueryToken')).toBe('kiosk-val');
    });
  });

  describe('getKioskAuthQueryToken', () => {
    it('extracts kiosk token from kt query param', () => {
      const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const location = {state: null, search: '?kt=' + uuid};
      expect(getKioskAuthQueryToken(location)).toBe(uuid);
    });

    it('returns kiosk token from state', () => {
      const location = {state: {kioskQueryToken: 'kiosk-token'}, search: ''};
      expect(getKioskAuthQueryToken(location)).toBe('kiosk-token');
    });

    it('returns null when no kiosk token', () => {
      const location = {state: null, search: ''};
      expect(getKioskAuthQueryToken(location)).toBeNull();
    });
  });

  describe('getGuestOnly', () => {
    it('returns true from location.state.guestOnly', () => {
      const location = {state: {guestOnly: true}, search: ''};
      expect(getGuestOnly(location)).toBe(true);
    });

    it('returns true from query param guestOnly=true', () => {
      const location = {state: null, search: '?guestOnly=true'};
      expect(getGuestOnly(location)).toBe(true);
    });

    it('returns false from query param guestOnly=false', () => {
      const location = {state: null, search: '?guestOnly=false'};
      expect(getGuestOnly(location)).toBe(false);
    });

    it('returns false when no guestOnly param', () => {
      const location = {state: null, search: ''};
      expect(getGuestOnly(location)).toBe(false);
    });
  });
});
