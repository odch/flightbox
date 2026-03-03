import reducer from './reducer';
import * as actions from './actions';
import { FIREBASE_AUTHENTICATION_EVENT } from '../../auth';

describe('modules', () => {
  describe('ui', () => {
    describe('showLogin', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {} as any)
          ).toEqual(false);
        });

        describe('SHOW_LOGIN', () => {
          it('should set state to true', () => {
            expect(
              reducer(false, actions.showLogin())
            ).toEqual(true);
          });
        });

        describe('HIDE_LOGIN', () => {
          it('should set state to false', () => {
            expect(
              reducer(true, actions.hideLogin())
            ).toEqual(false);
          });
        });

        describe('FIREBASE_AUTHENTICATION_EVENT', () => {
          it('should hide login when authData is provided', () => {
            expect(
              reducer(true, {
                type: FIREBASE_AUTHENTICATION_EVENT,
                payload: { authData: { uid: 'user-123' } },
              } as any)
            ).toEqual(false);
          });

          it('should keep current state when authData is null', () => {
            expect(
              reducer(true, {
                type: FIREBASE_AUTHENTICATION_EVENT,
                payload: { authData: null },
              } as any)
            ).toEqual(true);
          });

          it('should keep current state when authData is undefined', () => {
            expect(
              reducer(false, {
                type: FIREBASE_AUTHENTICATION_EVENT,
                payload: { authData: undefined },
              } as any)
            ).toEqual(false);
          });
        });
      });
    });
  });
});
