import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import {loadCredentialsToken, loadGuestToken, loadKioskToken} from '../../util/auth';
import {expectDoneWithoutReturn, expectDoneWithReturn} from '../../../test/sagaUtils';
import firebase, {authenticate as fbAuth, requestSignInCode as fbRequestSignInCode, verifyOtpCode as fbVerifyOtpCode, unauth as fbUnauth, watchAuthState} from '../../util/firebase';
import {
  registerPasskey as fbRegisterPasskey,
  authenticateWithPasskey as fbAuthenticateWithPasskey,
  removePasskey as fbRemovePasskey,
} from '../../util/webauthn';
import {get} from 'firebase/database';

jest.mock('../../util/firebase');
jest.mock('../../util/webauthn');
jest.mock('../../i18n', () => ({
  language: 'de',
}));
jest.mock('firebase/database', () => ({
  get: jest.fn(),
  query: jest.fn(r => r),
  orderByChild: jest.fn(),
  equalTo: jest.fn(),
  limitToFirst: jest.fn(),
}));
jest.mock('../../../theme/lszt', () => ({ colors: { main: '#003863' } }));
jest.mock('../../../theme/lspv', () => ({ colors: { main: '#003863' } }));
jest.mock('../../../theme/lszo', () => ({ colors: { main: '#003863' } }));
jest.mock('../../../theme/lsze', () => ({ colors: { main: '#003863' } }));
jest.mock('../../../theme/lszm', () => ({ colors: { main: '#003863' } }));

describe('modules', () => {
  describe('auth', () => {
    describe('sagas', () => {
      describe('doUsernamePasswordAuthentication', () => {
        it('should trigger Firebase authentication if successful', () => {
          const generator = sagas.doUsernamePasswordAuthentication(actions.authenticate('myuser', 'mypassword'));

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          expect(generator.next().value).toEqual(call(loadCredentialsToken, {
            username: 'myuser',
            password: 'mypassword'
          }));
          expect(generator.next('validtoken').value)
            .toEqual(put(actions.requestFirebaseAuthentication(
              'validtoken',
              actions.usernamePasswordAuthenticationFailure()
            )));

          expectDoneWithoutReturn(generator);
        });

        it('should put failure action if username is empty', () => {
          const generator = sagas.doUsernamePasswordAuthentication(actions.authenticate('', 'mypassword'));

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          expect(generator.next().value).toEqual(put(actions.usernamePasswordAuthenticationFailure()));

          expectDoneWithoutReturn(generator);
        });

        it('should put failure action if password is empty', () => {
          const generator = sagas.doUsernamePasswordAuthentication(actions.authenticate('username', ''));

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          expect(generator.next().value).toEqual(put(actions.usernamePasswordAuthenticationFailure()));

          expectDoneWithoutReturn(generator);
        });

        it('should put failure action if authentication failed', () => {
          const generator = sagas.doUsernamePasswordAuthentication(actions.authenticate('myuser', 'mypassword'));

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          expect(generator.next().value).toEqual(call(loadCredentialsToken, {
            username: 'myuser',
            password: 'mypassword'
          }));
          expect(generator.next(null).value).toEqual(put(actions.usernamePasswordAuthenticationFailure()));

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doFirebaseAuthentication', () => {
        it('should call firebase authentication', () => {
          const generator = sagas.doFirebaseAuthentication(actions.requestFirebaseAuthentication(
            'token',
            actions.usernamePasswordAuthenticationFailure()
          ));

          expect(generator.next().value).toEqual(call(fbAuth, 'token'));

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doLogout', () => {
        it('should call firebase authentication', () => {
          const generator = sagas.doLogout();

          expect(generator.next().value).toEqual(call(fbUnauth));

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doListenFirebaseAuthentication', () => {
        it('should mark authentication initialized if currently logged out', () => {
          const generator = sagas.doListenFirebaseAuthentication(actions.firebaseAuthentication(null));

          expect(generator.next().value).toEqual(put(actions.firebaseAuthenticationEvent(null)));
          expect(generator.next().value).toEqual(put(actions.markAuthenticationInitialized()));

          expectDoneWithoutReturn(generator);
        });

        it('should put firebaseAuthenticationEvent with admin flag true if is admin user', () => {
          const generator = sagas.doListenFirebaseAuthentication(actions.firebaseAuthentication({
            uid: 'myadminuser',
            expires: 1,
            token: 'validtoken',
            email: 'admin@example.com'
          }));

          expect(generator.next().value).toEqual(call(sagas.getLoginData, 'myadminuser'));
          expect(generator.next({
            admin: true,
            links: false
          }).value).toEqual(call(sagas.getName, 'myadminuser'));
          expect(generator.next('Hans Muster').value).toEqual(put(actions.firebaseAuthenticationEvent({
            admin: true,
            allMovements: false,
            links: false,
            expiration: 1000,
            token: 'validtoken',
            uid: 'myadminuser',
            name: 'Hans Muster',
            email: 'admin@example.com',
            guest: false,
            kiosk: false,
            local: false
          })));

          expectDoneWithoutReturn(generator);
        });

        it('should put firebaseAuthenticationEvent with admin flag false if is admin user', () => {
          const generator = sagas.doListenFirebaseAuthentication(actions.firebaseAuthentication({
            uid: 'testuser',
            expires: 1,
            token: 'validtoken',
            email: 'testuser@example.com'
          }));

          expect(generator.next().value).toEqual(call(sagas.getLoginData, 'testuser'));
          expect(generator.next({
            admin: false
          }).value).toEqual(call(sagas.getName, 'testuser'));
          expect(generator.next('Hans Muster').value).toEqual(put(actions.firebaseAuthenticationEvent({
            admin: false,
            allMovements: false,
            links: true,
            expiration: 1000,
            token: 'validtoken',
            uid: 'testuser',
            name: 'Hans Muster',
            email: 'testuser@example.com',
            guest: false,
            kiosk: false,
            local: false
          })));

          expectDoneWithoutReturn(generator);
        });

        it('should put firebaseAuthenticationEvent with allMovements flag for non-admin allMovements user', () => {
          const generator = sagas.doListenFirebaseAuthentication(actions.firebaseAuthentication({
            uid: 'vieweruser',
            expires: 1,
            token: 'validtoken',
            email: 'viewer@example.com'
          }));

          expect(generator.next().value).toEqual(call(sagas.getLoginData, 'vieweruser'));
          expect(generator.next({
            admin: false,
            allMovements: true
          }).value).toEqual(call(sagas.getName, 'vieweruser'));
          expect(generator.next('Hans Muster').value).toEqual(put(actions.firebaseAuthenticationEvent({
            admin: false,
            allMovements: true,
            links: true,
            expiration: 1000,
            token: 'validtoken',
            uid: 'vieweruser',
            name: 'Hans Muster',
            email: 'viewer@example.com',
            guest: false,
            kiosk: false,
            local: false
          })));

          expectDoneWithoutReturn(generator);
        });
      });

      describe('getName', () => {
        it('should return the name of the user', () => {
          const generator = sagas.getName('userid');
          expect(generator.next().value).toEqual(call(sagas.loadUser, 'userid'));
          const user = {
            firstname: 'Hans',
            lastname: 'Meier'
          };
          expectDoneWithReturn(generator, user, 'Hans Meier');
        })

        it('should return null if user not found', () => {
          const generator = sagas.getName('userid');
          expect(generator.next().value).toEqual(call(sagas.loadUser, 'userid'));
          expectDoneWithReturn(generator, null, null);
        });
      });

      describe('loadUser', () => {
        it('should return the user as object', () => {
          const generator = sagas.loadUser('userid');
          expect(generator.next().value).toEqual(call(firebase, '/users'));
          const usersRef = {};
          expect(generator.next(usersRef).value).toEqual(call(sagas.findByMemberNr, usersRef, 'userid'));
          const userObject = {
            firstname: 'Hans',
            lastname: 'Meier',
            memberNr: 'userid'
          };
          const snapshot = {
            val: () => ({
              'xyz': userObject
            })
          };
          expectDoneWithReturn(generator, snapshot, userObject);
        })

        it('should return null if user not found', () => {
          const generator = sagas.loadUser('userid');
          expect(generator.next().value).toEqual(call(firebase, '/users'));
          const usersRef = {};
          expect(generator.next(usersRef).value).toEqual(call(sagas.findByMemberNr, usersRef, 'userid'));
          const snapshot = {
            val: () => ({})
          };
          expectDoneWithReturn(generator, snapshot, null);
        });
      });

      describe('doGuestTokenAuthentication', () => {
        it('should trigger Firebase authentication if guest token found', () => {
          const queryToken = 'guest-query-token';
          const guestToken = 'firebase-guest-token';
          const action = actions.authenticateAsGuest(queryToken);

          const generator = sagas.doGuestTokenAuthentication(action);

          expect(generator.next().value).toEqual(call(loadGuestToken, queryToken));
          expect(generator.next(guestToken).value).toEqual(
            put(actions.requestFirebaseAuthentication(
              guestToken,
              actions.guestTokenAuthenticationFailure()
            ))
          );

          expectDoneWithoutReturn(generator);
        });

        it('should put failure action if no guest token found', () => {
          const queryToken = 'guest-query-token';
          const action = actions.authenticateAsGuest(queryToken);

          const generator = sagas.doGuestTokenAuthentication(action);

          expect(generator.next().value).toEqual(call(loadGuestToken, queryToken));
          expect(generator.next(null).value).toEqual(put(actions.guestTokenAuthenticationFailure()));

          expectDoneWithoutReturn(generator);
        });

        it('should put failure action if an exception is thrown', () => {
          const queryToken = 'guest-query-token';
          const action = actions.authenticateAsGuest(queryToken);

          const generator = sagas.doGuestTokenAuthentication(action);

          expect(generator.next().value).toEqual(call(loadGuestToken, queryToken));

          const error = new Error('network error');
          expect(generator.throw(error).value).toEqual(put(actions.guestTokenAuthenticationFailure()));

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doKioskTokenAuthentication', () => {
        it('should trigger Firebase authentication if kiosk token found', () => {
          const queryToken = 'kiosk-query-token';
          const kioskToken = 'firebase-kiosk-token';
          const action = actions.authenticateAsKiosk(queryToken);

          const generator = sagas.doKioskTokenAuthentication(action);

          expect(generator.next().value).toEqual(call(loadKioskToken, queryToken));
          expect(generator.next(kioskToken).value).toEqual(
            put(actions.requestFirebaseAuthentication(
              kioskToken,
              actions.kioskTokenAuthenticationFailure()
            ))
          );

          expectDoneWithoutReturn(generator);
        });

        it('should put failure action if no kiosk token found', () => {
          const queryToken = 'kiosk-query-token';
          const action = actions.authenticateAsKiosk(queryToken);

          const generator = sagas.doKioskTokenAuthentication(action);

          expect(generator.next().value).toEqual(call(loadKioskToken, queryToken));
          expect(generator.next(null).value).toEqual(put(actions.kioskTokenAuthenticationFailure()));

          expectDoneWithoutReturn(generator);
        });

        it('should put failure action if an exception is thrown', () => {
          const queryToken = 'kiosk-query-token';
          const action = actions.authenticateAsKiosk(queryToken);

          const generator = sagas.doKioskTokenAuthentication(action);

          expect(generator.next().value).toEqual(call(loadKioskToken, queryToken));

          const error = new Error('network error');
          expect(generator.throw(error).value).toEqual(put(actions.kioskTokenAuthenticationFailure()));

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doFirebaseAuthentication', () => {
        it('should put failure action if firebase auth throws', () => {
          const failureAction = actions.usernamePasswordAuthenticationFailure();
          const generator = sagas.doFirebaseAuthentication(
            actions.requestFirebaseAuthentication('token', failureAction)
          );

          expect(generator.next().value).toEqual(call(fbAuth, 'token'));

          const error = new Error('firebase error');
          expect(generator.throw(error).value).toEqual(put(failureAction));

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doListenFirebaseAuthentication', () => {
        it('should mark authentication initialized when not authenticated and no kiosk token', () => {
          const generator = sagas.doListenFirebaseAuthentication(
            actions.firebaseAuthentication(null)
          );

          expect(generator.next().value).toEqual(put(actions.firebaseAuthenticationEvent(null)));
          expect(generator.next().value).toEqual(put(actions.markAuthenticationInitialized()));

          expectDoneWithoutReturn(generator);
        });
      });

      describe('getLoginData', () => {
        it('should resolve with snapshot value if snapshot exists', async () => {
          const mockSnapshot = {
            exists: () => true,
            val: () => ({ admin: true })
          };
          const mockRef = {};
          (firebase as jest.Mock).mockReturnValue(mockRef);
          (get as jest.Mock).mockResolvedValue(mockSnapshot);

          const result = await sagas.getLoginData('uid123');
          expect(result).toEqual({ admin: true });
          expect(firebase).toHaveBeenCalledWith('/logins/uid123');
          expect(get).toHaveBeenCalledWith(mockRef);
        });

        it('should resolve with null if snapshot does not exist', async () => {
          const mockSnapshot = { exists: () => false };
          const mockRef = {};
          (firebase as jest.Mock).mockReturnValue(mockRef);
          (get as jest.Mock).mockResolvedValue(mockSnapshot);

          const result = await sagas.getLoginData('uid123');
          expect(result).toBeNull();
        });

        it('should resolve with null if get rejects', async () => {
          const mockRef = {};
          (firebase as jest.Mock).mockReturnValue(mockRef);
          (get as jest.Mock).mockRejectedValue(new Error('permission denied'));

          const result = await sagas.getLoginData('uid123');
          expect(result).toBeNull();
        });
      });

      describe('sendAuthenticationEmail', () => {
        beforeEach(() => {
          global.__CONF__ = {
            aerodrome: { name: 'Test Airport' },
            theme: 'lszt'
          };
          global.__FIREBASE_PROJECT_ID__ = 'test-project';
        });

        it('should call requestSignInCode with email, airportName and themeColor', () => {
          const action = actions.sendAuthenticationEmail('user@example.com', false);
          const generator = sagas.sendAuthenticationEmail(action);

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          // next: sets isLocalSignIn in localStorage (synchronous)
          expect(generator.next().value).toEqual(
            call(fbRequestSignInCode, 'user@example.com', 'Test Airport', '#003863', 'de')
          );

          expect(generator.next().value).toEqual(
            put(actions.sendAuthenticationEmailSuccess())
          );

          expectDoneWithoutReturn(generator);
        });

        it('should put sendAuthenticationEmailFailure on exception', () => {
          const action = actions.sendAuthenticationEmail('user@example.com', false);
          const generator = sagas.sendAuthenticationEmail(action);

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          // next: sets isLocalSignIn in localStorage (synchronous), then calls requestSignInCode
          expect(generator.next().value).toEqual(
            call(fbRequestSignInCode, 'user@example.com', 'Test Airport', '#003863', 'de')
          );

          const error = new Error('Network error');
          expect(generator.throw(error).value).toEqual(
            put(actions.sendAuthenticationEmailFailure())
          );

          expectDoneWithoutReturn(generator);
        });

        it('should do nothing if email is empty', () => {
          const action = actions.sendAuthenticationEmail('', false);
          const generator = sagas.sendAuthenticationEmail(action);

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          expectDoneWithoutReturn(generator);
        });
      });

      describe('doVerifyOtpCode', () => {
        it('should put requestFirebaseAuthentication on success', () => {
          const action = actions.verifyOtpCode('user@example.com', '123456');
          const generator = sagas.doVerifyOtpCode(action);

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          expect(generator.next().value).toEqual(
            call(fbVerifyOtpCode, 'user@example.com', '123456')
          );

          const token = 'custom-token-abc';
          expect(generator.next(token).value).toEqual(
            put(actions.requestFirebaseAuthentication(token, actions.otpVerificationFailure()))
          );

          expectDoneWithoutReturn(generator);
        });

        it('should put otpVerificationFailure on exception', () => {
          const action = actions.verifyOtpCode('user@example.com', '000000');
          const generator = sagas.doVerifyOtpCode(action);

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          expect(generator.next().value).toEqual(
            call(fbVerifyOtpCode, 'user@example.com', '000000')
          );

          const error = new Error('Invalid or expired code');
          expect(generator.throw(error).value).toEqual(
            put(actions.otpVerificationFailure())
          );

          expectDoneWithoutReturn(generator);
        });
      });

      describe('createFbAuthenticationChannel', () => {
        it('should return a channel when watchAuthState succeeds', () => {
          (watchAuthState as jest.Mock).mockImplementation(() => {});
          const channel = sagas.createFbAuthenticationChannel();
          expect(channel).toBeDefined();
          expect(channel.take).toBeDefined();
          expect(channel.put).toBeDefined();
        });

        it('should return a fallback channel with null when watchAuthState throws', async () => {
          (watchAuthState as jest.Mock).mockImplementation(() => {
            throw new Error('Firebase not initialized');
          });
          const channel = sagas.createFbAuthenticationChannel();
          expect(channel).toBeDefined();
          const value = await channel.take();
          expect(value).toBeNull();
        });
      });

      describe('doUsernamePasswordAuthentication', () => {
        it('should put failure action if exception is thrown', () => {
          const generator = sagas.doUsernamePasswordAuthentication(
            actions.authenticate('myuser', 'mypassword')
          );

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          expect(generator.next().value).toEqual(call(loadCredentialsToken, {
            username: 'myuser',
            password: 'mypassword'
          }));

          const error = new Error('network error');
          expect(generator.throw(error).value).toEqual(
            put(actions.usernamePasswordAuthenticationFailure())
          );

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doLoginWithPasskey', () => {
        let setItemSpy: jest.SpyInstance;

        beforeEach(() => {
          setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
        });

        afterEach(() => {
          setItemSpy.mockRestore();
        });

        it('converges on requestFirebaseAuthentication like OTP flow', () => {
          const action = actions.loginWithPasskey('user@example.com');
          const generator = sagas.doLoginWithPasskey(action);

          expect(generator.next().value).toEqual(
            call(fbAuthenticateWithPasskey, 'user@example.com')
          );

          const token = 'ct-abc';
          expect(generator.next(token).value).toEqual(
            put(actions.requestFirebaseAuthentication(token, actions.loginWithPasskeyFailure()))
          );

          expectDoneWithoutReturn(generator);
          expect(setItemSpy).toHaveBeenCalledWith('isLocalSignIn', 'true');
        });

        it('supports usernameless (no email) path', () => {
          const action = actions.loginWithPasskey();
          const generator = sagas.doLoginWithPasskey(action);

          expect(generator.next().value).toEqual(
            call(fbAuthenticateWithPasskey, undefined)
          );
        });

        it('puts failure action on exception', () => {
          const action = actions.loginWithPasskey('user@example.com');
          const generator = sagas.doLoginWithPasskey(action);

          expect(generator.next().value).toEqual(
            call(fbAuthenticateWithPasskey, 'user@example.com')
          );

          const error = new Error('verification failed');
          expect(generator.throw(error).value).toEqual(put(actions.loginWithPasskeyFailure()));

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doRegisterPasskey', () => {
        it('registers and reloads passkeys on success', () => {
          const generator = sagas.doRegisterPasskey();

          expect(generator.next().value).toEqual(call(fbRegisterPasskey));
          expect(generator.next({ credentialId: 'c', deviceName: 'Mac', createdAt: 1 }).value)
            .toEqual(put(actions.registerPasskeySuccess()));
          expect(generator.next().value).toEqual(put(actions.loadPasskeys()));
          expectDoneWithoutReturn(generator);
        });

        it('puts failure action with message on exception', () => {
          const generator = sagas.doRegisterPasskey();

          expect(generator.next().value).toEqual(call(fbRegisterPasskey));

          const error = new Error('boom');
          expect(generator.throw(error).value).toEqual(
            put(actions.registerPasskeyFailure('boom'))
          );

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doLoadPasskeys', () => {
        it('loads credentials for current user', () => {
          const generator = sagas.doLoadPasskeys();

          expect(generator.next().value).toEqual(select(sagas.authDataSelector));

          const authData = { uid: 'u1' };
          const mockRef = {};
          (firebase as jest.Mock).mockReturnValue(mockRef);

          expect(generator.next(authData).value).toEqual(call(get as any, mockRef));
          expect(firebase).toHaveBeenCalledWith('/webauthnCredentials/u1');

          const snapshot = {
            exists: () => true,
            val: () => ({
              'cid-1': { deviceName: 'Laptop', createdAt: 100, lastUsedAt: 200 },
              'cid-2': { deviceName: 'Phone', createdAt: 300, lastUsedAt: null },
            }),
          };
          expect(generator.next(snapshot).value).toEqual(put(actions.loadPasskeysSuccess([
            { credentialId: 'cid-1', deviceName: 'Laptop', createdAt: 100, lastUsedAt: 200 },
            { credentialId: 'cid-2', deviceName: 'Phone', createdAt: 300, lastUsedAt: null },
          ])));

          expectDoneWithoutReturn(generator);
        });

        it('emits empty list when not authenticated', () => {
          const generator = sagas.doLoadPasskeys();

          expect(generator.next().value).toEqual(select(sagas.authDataSelector));
          expect(generator.next(null).value).toEqual(put(actions.loadPasskeysSuccess([])));

          expectDoneWithoutReturn(generator);
        });

        it('emits empty list when snapshot has no children', () => {
          const generator = sagas.doLoadPasskeys();

          expect(generator.next().value).toEqual(select(sagas.authDataSelector));

          const authData = { uid: 'u1' };
          const mockRef = {};
          (firebase as jest.Mock).mockReturnValue(mockRef);

          expect(generator.next(authData).value).toEqual(call(get as any, mockRef));

          const snapshot = { exists: () => false, val: () => null };
          expect(generator.next(snapshot).value).toEqual(put(actions.loadPasskeysSuccess([])));

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doRemovePasskey', () => {
        it('calls remove and dispatches success', () => {
          const action = actions.removePasskey('cid-1');
          const generator = sagas.doRemovePasskey(action);

          expect(generator.next().value).toEqual(call(fbRemovePasskey, 'cid-1'));
          expect(generator.next().value).toEqual(put(actions.removePasskeySuccess('cid-1')));

          expectDoneWithoutReturn(generator);
        });

        it('dispatches failure with message on exception', () => {
          const action = actions.removePasskey('cid-1');
          const generator = sagas.doRemovePasskey(action);

          expect(generator.next().value).toEqual(call(fbRemovePasskey, 'cid-1'));

          const error = new Error('boom');
          expect(generator.throw(error).value).toEqual(
            put(actions.removePasskeyFailure('cid-1', 'boom'))
          );

          expectDoneWithoutReturn(generator);
        });
      });
    });
  });
});
