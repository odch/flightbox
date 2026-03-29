import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  url: null,
  saving: false,
};

describe('modules', () => {
  describe('settings', () => {
    describe('privacyPolicyUrl', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {} as any)
          ).toEqual(INITIAL_STATE);
        });

        describe('PRIVACY_POLICY_URL_LOADED', () => {
          it('should set the url', () => {
            const url = 'https://example.com/privacy';
            expect(
              reducer({
                url: null,
                saving: false,
              }, actions.privacyPolicyUrlLoaded(url))
            ).toEqual({
              url,
              saving: false,
            });
          });

          it('should override an existing url', () => {
            expect(
              reducer({
                url: 'https://old.example.com/privacy',
                saving: false,
              }, actions.privacyPolicyUrlLoaded('https://new.example.com/privacy'))
            ).toEqual({
              url: 'https://new.example.com/privacy',
              saving: false,
            });
          });

          it('should set the url to null', () => {
            expect(
              reducer({
                url: 'https://example.com/privacy',
                saving: false,
              }, actions.privacyPolicyUrlLoaded(null))
            ).toEqual({
              url: null,
              saving: false,
            });
          });
        });

        describe('SET_PRIVACY_POLICY_URL_SAVING', () => {
          it('should set saving to true', () => {
            expect(
              reducer({
                url: 'https://example.com/privacy',
                saving: false,
              }, actions.setPrivacyPolicyUrlSaving())
            ).toEqual({
              url: 'https://example.com/privacy',
              saving: true,
            });
          });
        });

        describe('SET_PRIVACY_POLICY_URL_SUCCESS', () => {
          it('should set saving to false', () => {
            expect(
              reducer({
                url: 'https://example.com/privacy',
                saving: true,
              }, actions.setPrivacyPolicyUrlSuccess())
            ).toEqual({
              url: 'https://example.com/privacy',
              saving: false,
            });
          });
        });
      });
    });
  });
});
