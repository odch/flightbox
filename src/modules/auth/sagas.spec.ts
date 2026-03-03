import {call, put} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import {loadCredentialsToken, loadGuestToken, loadIpToken, loadKioskToken} from '../../util/auth';
import {expectDoneWithoutReturn, expectDoneWithReturn} from '../../../test/sagaUtils';
import firebase, {authenticate as fbAuth, authenticateEmail as fbAuthEmail, isSignInWithEmail, signInWithEmail, unauth as fbUnauth} from '../../util/firebase';
import {get} from 'firebase/database';

jest.mock('../../util/firebase');
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
jest.mock('../../../theme/lszk', () => ({ colors: { main: '#003863' } }));
jest.mock('../../../theme/lszm', () => ({ colors: { main: '#003863' } }));

describe('modules', () => {
  describe('auth', () => {
    describe('sagas', () => {
      describe('doIpAuthentication', () => {
        it('should trigger Firebase authentication if successful', () => {
          const generator = sagas.doIpAuthentication();

          expect(generator.next().value).toEqual(call(loadIpToken));

          expect(generator.next('validtoken').value).toEqual(put(actions.requestFirebaseAuthentication('validtoken')));

          expectDoneWithoutReturn(generator);
        });

        it('should put failure action if failed', () => {
          const generator = sagas.doIpAuthentication();

          expect(generator.next().value).toEqual(call(loadIpToken));

          expect(generator.next(null).value).toEqual(put(actions.ipAuthenticationFailure()));

          expectDoneWithoutReturn(generator);
        });
      });

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
        it('should request IP authentication if currently logged out', () => {
          (isSignInWithEmail as jest.Mock).mockReturnValue(false);

          const generator = sagas.doListenFirebaseAuthentication(actions.firebaseAuthentication(null));

          expect(generator.next().value).toEqual(put(actions.firebaseAuthenticationEvent(null)));
          expect(generator.next().value).toEqual(put(actions.requestIpAuthentication()));

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

        it('should put firebaseAuthenticationEvent without uid for ipauth uid', () => {
          const generator = sagas.doListenFirebaseAuthentication(actions.firebaseAuthentication({
            uid: 'ipauth',
            expires: 1,
            token: 'validtoken'
          }));

          expect(generator.next(false).value).toEqual(put(actions.firebaseAuthenticationEvent({
            expiration: 1000,
            token: 'validtoken',
            local: true
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
        it('should request email authentication when signed in with email link and email in storage', () => {
          (isSignInWithEmail as jest.Mock).mockReturnValue(true);
          localStorage.setItem('emailForSignIn', 'user@example.com');

          const generator = sagas.doListenFirebaseAuthentication(
            actions.firebaseAuthentication(null)
          );

          expect(generator.next().value).toEqual(put(actions.firebaseAuthenticationEvent(null)));
          expect(generator.next().value).toEqual(put(actions.requestEmailAuthentication()));

          expectDoneWithoutReturn(generator);
          localStorage.removeItem('emailForSignIn');
        });

        it('should request ip authentication when not signed in with email and no kiosk token', () => {
          (isSignInWithEmail as jest.Mock).mockReturnValue(false);
          localStorage.removeItem('emailForSignIn');

          const generator = sagas.doListenFirebaseAuthentication(
            actions.firebaseAuthentication(null)
          );

          expect(generator.next().value).toEqual(put(actions.firebaseAuthenticationEvent(null)));
          expect(generator.next().value).toEqual(put(actions.requestIpAuthentication()));

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

        it('should put sendAuthenticationEmailFailure on exception', () => {
          const action = actions.sendAuthenticationEmail('user@example.com', false);
          const generator = sagas.sendAuthenticationEmail(action);

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          expect(generator.next().value).toEqual(
            call(fbAuthEmail, 'user@example.com', false)
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

      describe('completeEmailAuthentication', () => {
        it('should sign in with email and clean up browser state', () => {
          const action = actions.completeEmailAuthentication('user@example.com');
          const generator = sagas.completeEmailAuthentication(action);

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));
          expect(generator.next().value).toEqual(call(signInWithEmail));
          expect(generator.next().value).toEqual(call(sagas.cleanUpLoginBrowserState));

          expectDoneWithoutReturn(generator);
        });

        it('should put emailAuthenticationCompletionFailure on exception', () => {
          const action = actions.completeEmailAuthentication('user@example.com');
          const generator = sagas.completeEmailAuthentication(action);

          expect(generator.next().value).toEqual(put(actions.setSubmitting()));

          const error = new Error('sign in failed');
          expect(generator.throw(error).value).toEqual(
            put(actions.emailAuthenticationCompletionFailure())
          );

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doEmailAuthentication', () => {
        it('should sign in with email and then clean up and reload', () => {
          const generator = sagas.doEmailAuthentication();

          expect(generator.next().value).toEqual(call(signInWithEmail));
          expect(generator.next().value).toEqual(call(sagas.cleanUpLoginBrowserState));

          // after finally block generator is done
          expectDoneWithoutReturn(generator);
        });

        it('should call cleanUpLoginBrowserState even if signInWithEmail throws', () => {
          const generator = sagas.doEmailAuthentication();

          expect(generator.next().value).toEqual(call(signInWithEmail));

          const error = new Error('sign in error');
          // throw causes finally to run
          expect(generator.throw(error).value).toEqual(call(sagas.cleanUpLoginBrowserState));

          expectDoneWithoutReturn(generator);
        });
      });

      describe('cleanUpLoginBrowserState', () => {
        it('should remove emailForSignIn and yield replaceState call', () => {
          localStorage.setItem('emailForSignIn', 'test@example.com');

          const generator = sagas.cleanUpLoginBrowserState();

          // The generator first removes item synchronously, then yields replaceState
          const step = generator.next();
          // Step should be a CALL to window.history.replaceState
          expect(step.value).toMatchObject({ type: 'CALL' });
          expect((step.value as any).payload.context).toBe(window.history);
          expect((step.value as any).payload.fn).toBe(window.history.replaceState);

          // localStorage.removeItem was called synchronously before the yield
          expect(localStorage.getItem('emailForSignIn')).toBeNull();

          expectDoneWithoutReturn(generator);
        });
      });

      describe('doIpAuthentication (disabled)', () => {
        it('should put ipAuthenticationFailure when IP authentication is disabled', () => {
          const origVal = global.__DISABLE_IP_AUTHENTICATION__;
          global.__DISABLE_IP_AUTHENTICATION__ = true;

          const generator = sagas.doIpAuthentication();

          expect(generator.next().value).toEqual(put(actions.ipAuthenticationFailure()));

          expectDoneWithoutReturn(generator);

          global.__DISABLE_IP_AUTHENTICATION__ = origVal;
        });

        it('should put ipAuthenticationFailure when loadIpToken throws', () => {
          const origVal = global.__DISABLE_IP_AUTHENTICATION__;
          global.__DISABLE_IP_AUTHENTICATION__ = false;

          const generator = sagas.doIpAuthentication();

          expect(generator.next().value).toEqual(call(loadIpToken));

          const error = new Error('network error');
          expect(generator.throw(error).value).toEqual(put(actions.ipAuthenticationFailure()));

          expectDoneWithoutReturn(generator);

          global.__DISABLE_IP_AUTHENTICATION__ = origVal;
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
    });
  });
});
