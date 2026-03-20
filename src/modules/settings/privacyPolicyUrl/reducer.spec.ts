import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  url: null,
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
              }, actions.privacyPolicyUrlLoaded(url))
            ).toEqual({
              url,
            });
          });

          it('should override an existing url', () => {
            expect(
              reducer({
                url: 'https://old.example.com/privacy',
              }, actions.privacyPolicyUrlLoaded('https://new.example.com/privacy'))
            ).toEqual({
              url: 'https://new.example.com/privacy',
            });
          });

          it('should set the url to null', () => {
            expect(
              reducer({
                url: 'https://example.com/privacy',
              }, actions.privacyPolicyUrlLoaded(null))
            ).toEqual({
              url: null,
            });
          });
        });
      });
    });
  });
});
