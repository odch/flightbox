import reducer from './reducer';
import * as actions from './actions';
import { FIREBASE_AUTHENTICATION_EVENT, USERNAME_PASSWORD_AUTHENTICATION_FAILURE } from '../../auth';
import { SEND_AUTHENTICATION_EMAIL_FAILURE, SEND_AUTHENTICATION_EMAIL_SUCCESS } from '../../auth/actions';

const INITIAL_STATE = {
  username: '',
  password: '',
  email: '',
  submitting: false,
  failure: false,
  emailSent: false,
};

describe('modules', () => {
  describe('ui', () => {
    describe('loginPage', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {} as any)
          ).toEqual(INITIAL_STATE);
        });

        describe('UPDATE_USERNAME', () => {
          it('should set the username', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
              }, actions.updateUsername('hans'))
            ).toEqual({
              ...INITIAL_STATE,
              username: 'hans',
            });
          });
        });

        describe('UPDATE_PASSWORD', () => {
          it('should set the password', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
              }, actions.updatePassword('secret'))
            ).toEqual({
              ...INITIAL_STATE,
              password: 'secret',
            });
          });
        });

        describe('UPDATE_EMAIL', () => {
          it('should set the email', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
              }, actions.updateEmail('hans@example.com'))
            ).toEqual({
              ...INITIAL_STATE,
              email: 'hans@example.com',
            });
          });
        });

        describe('SEND_AUTHENTICATION_EMAIL_SUCCESS', () => {
          it('should set emailSent to true', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                email: 'hans@example.com',
              }, { type: SEND_AUTHENTICATION_EMAIL_SUCCESS })
            ).toEqual({
              ...INITIAL_STATE,
              email: 'hans@example.com',
              emailSent: true,
            });
          });
        });

        describe('SEND_AUTHENTICATION_EMAIL_FAILURE', () => {
          it('should reset emailSent to false', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                email: 'hans@example.com',
                emailSent: true,
              }, { type: SEND_AUTHENTICATION_EMAIL_FAILURE })
            ).toEqual({
              ...INITIAL_STATE,
              email: 'hans@example.com',
              emailSent: false,
            });
          });
        });

        describe('USERNAME_PASSWORD_AUTHENTICATION_FAILURE', () => {
          it('should clear the password', () => {
            expect(
              reducer({
                ...INITIAL_STATE,
                username: 'hans',
                password: 'wrong-password',
              }, { type: USERNAME_PASSWORD_AUTHENTICATION_FAILURE })
            ).toEqual({
              ...INITIAL_STATE,
              username: 'hans',
              password: '',
            });
          });
        });

        describe('FIREBASE_AUTHENTICATION_EVENT', () => {
          it('should reset to initial state', () => {
            expect(
              reducer({
                username: 'hans',
                password: 'secret',
                email: 'hans@example.com',
                submitting: true,
                failure: true,
                emailSent: true,
              }, { type: FIREBASE_AUTHENTICATION_EVENT })
            ).toEqual(INITIAL_STATE);
          });
        });
      });
    });
  });
});
