import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  token: null,
};

describe('modules', () => {
  describe('settings', () => {
    describe('kioskAccessToken', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {})
          ).toEqual(INITIAL_STATE);
        });

        describe('KIOSK_ACCESS_TOKEN_LOADED', () => {
          it('should set the token', () => {
            const token = 'kiosk-token-xyz';
            expect(
              reducer({
                token: null,
              }, actions.kioskAccessTokenLoaded(token))
            ).toEqual({
              token,
            });
          });

          it('should override an existing token', () => {
            expect(
              reducer({
                token: 'old-kiosk-token',
              }, actions.kioskAccessTokenLoaded('new-kiosk-token'))
            ).toEqual({
              token: 'new-kiosk-token',
            });
          });

          it('should set the token to null', () => {
            expect(
              reducer({
                token: 'kiosk-token-xyz',
              }, actions.kioskAccessTokenLoaded(null))
            ).toEqual({
              token: null,
            });
          });
        });
      });
    });
  });
});
