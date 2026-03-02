import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  profile: undefined,
  saving: false,
};

describe('modules', () => {
  describe('profile', () => {
    describe('reducer', () => {
      it('should handle initial state', () => {
        expect(
          reducer(undefined, {})
        ).toEqual(INITIAL_STATE);
      });

      describe('PROFILE_LOADED', () => {
        it('should set the profile', () => {
          const profile = {
            firstname: 'Hans',
            lastname: 'Meier',
            email: 'hans@example.com',
          };
          expect(
            reducer({
              profile: undefined,
              saving: false,
            }, actions.profileLoaded(profile))
          ).toEqual({
            profile,
            saving: false,
          });
        });

        it('should override existing profile', () => {
          const oldProfile = { firstname: 'Old', lastname: 'User' };
          const newProfile = { firstname: 'New', lastname: 'User' };
          expect(
            reducer({
              profile: oldProfile,
              saving: false,
            }, actions.profileLoaded(newProfile))
          ).toEqual({
            profile: newProfile,
            saving: false,
          });
        });
      });

      describe('SAVE_PROFILE', () => {
        it('should set saving to true', () => {
          expect(
            reducer({
              profile: { firstname: 'Hans' },
              saving: false,
            }, actions.saveProfile({ firstname: 'Hans' }))
          ).toEqual({
            profile: { firstname: 'Hans' },
            saving: true,
          });
        });
      });

      describe('SAVE_PROFILE_SUCCESS', () => {
        it('should set saving to false', () => {
          expect(
            reducer({
              profile: { firstname: 'Hans' },
              saving: true,
            }, actions.saveProfileSuccess())
          ).toEqual({
            profile: { firstname: 'Hans' },
            saving: false,
          });
        });
      });

      describe('SAVE_PROFILE_FAILURE', () => {
        it('should set saving to false', () => {
          expect(
            reducer({
              profile: { firstname: 'Hans' },
              saving: true,
            }, actions.saveProfileFailure())
          ).toEqual({
            profile: { firstname: 'Hans' },
            saving: false,
          });
        });
      });
    });
  });
});
