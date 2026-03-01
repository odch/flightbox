import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  token: null,
};

describe('modules', () => {
  describe('settings', () => {
    describe('guestAccessToken', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {})
          ).toEqual(INITIAL_STATE);
        });

        describe('GUEST_ACCESS_TOKEN_LOADED', () => {
          it('should set the token', () => {
            const token = 'abc123';
            expect(
              reducer({
                token: null,
              }, actions.guestAccessTokenLoaded(token))
            ).toEqual({
              token,
            });
          });

          it('should override an existing token', () => {
            expect(
              reducer({
                token: 'old-token',
              }, actions.guestAccessTokenLoaded('new-token'))
            ).toEqual({
              token: 'new-token',
            });
          });

          it('should set the token to null', () => {
            expect(
              reducer({
                token: 'abc123',
              }, actions.guestAccessTokenLoaded(null))
            ).toEqual({
              token: null,
            });
          });
        });
      });
    });
  });
});
