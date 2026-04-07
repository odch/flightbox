import {getInitialValues} from './MessagePage';

describe('MessagePage', () => {
  describe('getInitialValues', () => {
    it('returns empty object when profile and auth are undefined', () => {
      expect(getInitialValues(undefined, undefined)).toEqual({});
    });

    it('returns empty object when profile and auth are null', () => {
      expect(getInitialValues(null, null)).toEqual({});
    });

    it('returns name from profile firstname and lastname', () => {
      const profile = {firstname: 'Hans', lastname: 'Muster'};
      expect(getInitialValues(profile, null)).toEqual({
        name: 'Hans Muster',
      });
    });

    it('returns trimmed name when only firstname is set', () => {
      const profile = {firstname: 'Hans'};
      expect(getInitialValues(profile, null)).toEqual({
        name: 'Hans',
      });
    });

    it('returns trimmed name when only lastname is set', () => {
      const profile = {lastname: 'Muster'};
      expect(getInitialValues(profile, null)).toEqual({
        name: 'Muster',
      });
    });

    it('returns email from profile', () => {
      const profile = {email: 'hans@example.com'};
      expect(getInitialValues(profile, null)).toEqual({
        email: 'hans@example.com',
      });
    });

    it('falls back to auth email when profile email is missing', () => {
      const auth = {email: 'auth@example.com'};
      expect(getInitialValues({}, auth)).toEqual({
        email: 'auth@example.com',
      });
    });

    it('prefers profile email over auth email', () => {
      const profile = {email: 'profile@example.com'};
      const auth = {email: 'auth@example.com'};
      expect(getInitialValues(profile, auth)).toEqual({
        email: 'profile@example.com',
      });
    });

    it('returns phone from profile', () => {
      const profile = {phone: '0791234567'};
      expect(getInitialValues(profile, null)).toEqual({
        phone: '0791234567',
      });
    });

    it('does not include empty fields', () => {
      const result = getInitialValues({}, {});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('returns all fields when profile is complete', () => {
      const profile = {
        firstname: 'Hans',
        lastname: 'Muster',
        email: 'hans@example.com',
        phone: '0791234567',
      };
      expect(getInitialValues(profile, null)).toEqual({
        name: 'Hans Muster',
        email: 'hans@example.com',
        phone: '0791234567',
      });
    });
  });
});
