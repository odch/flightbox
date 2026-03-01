import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  initialized: false,
  authenticated: false,
  submitting: false,
  failure: false,
  emailAuthenticationCompletionFailure: false,
  guestAuthentication: {
    submitting: false,
    failure: false,
  },
};

describe('modules', () => {
  describe('auth', () => {
    describe('reducer', () => {
      it('should handle initial state', () => {
        expect(
          reducer(undefined, {})
        ).toEqual(INITIAL_STATE);
      });

      describe('SET_SUBMITTING', () => {
        it('should set submitting to true and clear failure', () => {
          expect(
            reducer({
              initialized: false,
              authenticated: false,
              submitting: false,
              failure: true,
              emailAuthenticationCompletionFailure: false,
              guestAuthentication: { submitting: false, failure: false },
            }, actions.setSubmitting())
          ).toEqual({
            initialized: false,
            authenticated: false,
            submitting: true,
            failure: false,
            emailAuthenticationCompletionFailure: false,
            guestAuthentication: { submitting: false, failure: false },
          });
        });
      });

      describe('REQUEST_GUEST_TOKEN_AUTHENTICATION', () => {
        it('should set guestAuthentication submitting to true and clear failure', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              guestAuthentication: { submitting: false, failure: true },
            }, actions.authenticateAsGuest('guest-token'))
          ).toEqual({
            ...INITIAL_STATE,
            guestAuthentication: { submitting: true, failure: false },
          });
        });
      });

      describe('GUEST_TOKEN_AUTHENTICATION_FAILURE', () => {
        it('should set guestAuthentication failure to true and clear submitting', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              guestAuthentication: { submitting: true, failure: false },
            }, actions.guestTokenAuthenticationFailure())
          ).toEqual({
            ...INITIAL_STATE,
            guestAuthentication: { submitting: false, failure: true },
          });
        });
      });

      describe('USERNAME_PASSWORD_AUTHENTICATION_FAILURE', () => {
        it('should set submitting to false and failure to true', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              submitting: true,
              failure: false,
            }, actions.usernamePasswordAuthenticationFailure())
          ).toEqual({
            ...INITIAL_STATE,
            submitting: false,
            failure: true,
          });
        });
      });

      describe('IP_AUTHENTICATION_FAILURE', () => {
        it('should set initialized to true', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              initialized: false,
            }, actions.ipAuthenticationFailure())
          ).toEqual({
            ...INITIAL_STATE,
            initialized: true,
          });
        });
      });

      describe('FIREBASE_AUTHENTICATION_EVENT', () => {
        it('should set authenticated state when authData is provided', () => {
          const authData = { uid: 'user-123', email: 'hans@example.com' };
          expect(
            reducer({
              ...INITIAL_STATE,
              submitting: true,
              failure: true,
            }, actions.firebaseAuthenticationEvent(authData))
          ).toEqual({
            initialized: true,
            authenticated: true,
            failure: false,
            submitting: false,
            data: authData,
            guestAuthentication: INITIAL_STATE.guestAuthentication,
          });
        });

        it('should return initial state when authData is null', () => {
          expect(
            reducer({
              initialized: true,
              authenticated: true,
              submitting: false,
              failure: false,
              emailAuthenticationCompletionFailure: false,
              data: { uid: 'user-123' },
              guestAuthentication: { submitting: false, failure: false },
            }, actions.firebaseAuthenticationEvent(null))
          ).toEqual(INITIAL_STATE);
        });
      });

      describe('EMAIL_AUTHENTICATION_COMPLETION_FAILURE', () => {
        it('should set submitting to false and emailAuthenticationCompletionFailure to true', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              submitting: true,
              emailAuthenticationCompletionFailure: false,
            }, actions.emailAuthenticationCompletionFailure())
          ).toEqual({
            ...INITIAL_STATE,
            submitting: false,
            emailAuthenticationCompletionFailure: true,
          });
        });
      });
    });
  });
});
