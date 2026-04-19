import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  initialized: false,
  authenticated: false,
  submitting: false,
  failure: false,
  otpVerificationFailure: false,
  guestAuthentication: {
    submitting: false,
    failure: false,
  },
  passkeyRegistration: { submitting: false, failure: false },
  passkeyLogin: { submitting: false, failure: false },
  passkeyRemoval: { failure: false },
  passkeys: [],
};

describe('modules', () => {
  describe('auth', () => {
    describe('reducer', () => {
      it('should handle initial state', () => {
        expect(
          reducer(undefined, {} as any)
        ).toEqual(INITIAL_STATE);
      });

      describe('SET_SUBMITTING', () => {
        it('should set submitting to true, clear failure, and clear otpVerificationFailure', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              failure: true,
              otpVerificationFailure: true,
            }, actions.setSubmitting())
          ).toEqual({
            ...INITIAL_STATE,
            submitting: true,
            failure: false,
            otpVerificationFailure: false,
          });
        });
      });

      describe('SEND_AUTHENTICATION_EMAIL_SUCCESS', () => {
        it('should set submitting to false', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              submitting: true,
            }, actions.sendAuthenticationEmailSuccess())
          ).toEqual({
            ...INITIAL_STATE,
            submitting: false,
          });
        });
      });

      describe('SEND_AUTHENTICATION_EMAIL_FAILURE', () => {
        it('should set submitting to false and failure to true', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              submitting: true,
              failure: false,
            }, actions.sendAuthenticationEmailFailure())
          ).toEqual({
            ...INITIAL_STATE,
            submitting: false,
            failure: true,
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
            passkeyRegistration: { submitting: false, failure: false },
            passkeyLogin: { submitting: false, failure: false },
            passkeyRemoval: { failure: false },
            passkeys: [],
          });
        });

        it('should return initial state when authData is null', () => {
          expect(
            reducer({
              initialized: true,
              authenticated: true,
              submitting: false,
              failure: false,
              otpVerificationFailure: false,
              data: { uid: 'user-123' },
              guestAuthentication: { submitting: false, failure: false },
              passkeyRegistration: { submitting: false, failure: false },
              passkeyLogin: { submitting: false, failure: false },
              passkeyRemoval: { failure: false },
              passkeys: [],
            }, actions.firebaseAuthenticationEvent(null))
          ).toEqual(INITIAL_STATE);
        });
      });

      describe('OTP_VERIFICATION_FAILURE', () => {
        it('should set submitting to false and otpVerificationFailure to true', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              submitting: true,
              otpVerificationFailure: false,
            }, actions.otpVerificationFailure())
          ).toEqual({
            ...INITIAL_STATE,
            submitting: false,
            otpVerificationFailure: true,
          });
        });
      });

      describe('REGISTER_PASSKEY', () => {
        it('sets passkeyRegistration.submitting', () => {
          expect(
            reducer(INITIAL_STATE, actions.registerPasskey())
          ).toEqual({
            ...INITIAL_STATE,
            passkeyRegistration: { submitting: true, failure: false },
          });
        });
      });

      describe('REGISTER_PASSKEY_FAILURE', () => {
        it('sets passkeyRegistration.failure and error message', () => {
          expect(
            reducer(INITIAL_STATE, actions.registerPasskeyFailure('bad'))
          ).toEqual({
            ...INITIAL_STATE,
            passkeyRegistration: { submitting: false, failure: true, errorMessage: 'bad' },
          });
        });
      });

      describe('REGISTER_PASSKEY_SUCCESS', () => {
        it('clears submitting and failure', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              passkeyRegistration: { submitting: true, failure: false },
            }, actions.registerPasskeySuccess())
          ).toEqual({
            ...INITIAL_STATE,
            passkeyRegistration: { submitting: false, failure: false },
          });
        });
      });

      describe('LOGIN_WITH_PASSKEY', () => {
        it('sets passkeyLogin.submitting and clears failure', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              passkeyLogin: { submitting: false, failure: true },
            }, actions.loginWithPasskey('a@b.c'))
          ).toEqual({
            ...INITIAL_STATE,
            passkeyLogin: { submitting: true, failure: false },
          });
        });
      });

      describe('LOGIN_WITH_PASSKEY_FAILURE', () => {
        it('sets failure and clears submitting', () => {
          expect(
            reducer({
              ...INITIAL_STATE,
              passkeyLogin: { submitting: true, failure: false },
            }, actions.loginWithPasskeyFailure())
          ).toEqual({
            ...INITIAL_STATE,
            passkeyLogin: { submitting: false, failure: true },
          });
        });
      });

      describe('LOAD_PASSKEYS_SUCCESS', () => {
        it('replaces passkeys list', () => {
          const passkeys = [
            { credentialId: 'c1', deviceName: 'Laptop', createdAt: 1, lastUsedAt: null },
          ];
          expect(
            reducer(INITIAL_STATE, actions.loadPasskeysSuccess(passkeys))
          ).toEqual({
            ...INITIAL_STATE,
            passkeys,
          });
        });
      });

      describe('REMOVE_PASSKEY_SUCCESS', () => {
        it('removes the matching credentialId', () => {
          const state = {
            ...INITIAL_STATE,
            passkeys: [
              { credentialId: 'c1', deviceName: 'Laptop', createdAt: 1, lastUsedAt: null },
              { credentialId: 'c2', deviceName: 'Phone', createdAt: 2, lastUsedAt: null },
            ],
          };
          expect(
            reducer(state, actions.removePasskeySuccess('c1'))
          ).toEqual({
            ...INITIAL_STATE,
            passkeys: [
              { credentialId: 'c2', deviceName: 'Phone', createdAt: 2, lastUsedAt: null },
            ],
          });
        });
      });

      describe('REMOVE_PASSKEY / REMOVE_PASSKEY_FAILURE', () => {
        it('clears removal failure state when remove starts', () => {
          const state = {
            ...INITIAL_STATE,
            passkeyRemoval: { failure: true, errorMessage: 'boom' },
          };
          expect(reducer(state, actions.removePasskey('c1'))).toEqual({
            ...INITIAL_STATE,
            passkeyRemoval: { failure: false },
          });
        });

        it('stores failure with message', () => {
          expect(
            reducer(INITIAL_STATE, actions.removePasskeyFailure('c1', 'boom'))
          ).toEqual({
            ...INITIAL_STATE,
            passkeyRemoval: { failure: true, errorMessage: 'boom' },
          });
        });
      });
    });
  });
});
