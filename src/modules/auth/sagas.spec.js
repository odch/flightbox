import { put, call } from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import { loadIpToken, loadCredentialsToken } from '../../util/auth';
import { expectDoneWithoutReturn, expectDoneWithReturn } from '../../../test/sagaUtils';
import firebase, { authenticate as fbAuth, unauth as fbUnauth } from '../../util/firebase';

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
          const generator = sagas.doListenFirebaseAuthentication(actions.firebaseAuthentication(null));

          expect(generator.next().value).toEqual(put(actions.firebaseAuthenticationEvent(null)));
          expect(generator.next().value).toEqual(put(actions.requestIpAuthentication()));

          expectDoneWithoutReturn(generator);
        });

        it('should put firebaseAuthenticationEvent with admin flag true if is admin user', () => {
          const generator = sagas.doListenFirebaseAuthentication(actions.firebaseAuthentication({
            uid: 'myadminuser',
            expires: 1,
            token: 'validtoken'
          }));

          expect(generator.next().value).toEqual(call(sagas.isAdmin, 'myadminuser'));
          expect(generator.next(true).value).toEqual(call(sagas.getName, 'myadminuser'));
          expect(generator.next('Hans Muster').value).toEqual(put(actions.firebaseAuthenticationEvent({
            admin: true,
            expiration: 1000,
            token: 'validtoken',
            uid: 'myadminuser',
            name: 'Hans Muster'
          })));

          expectDoneWithoutReturn(generator);
        });

        it('should put firebaseAuthenticationEvent with admin flag false if is admin user', () => {
          const generator = sagas.doListenFirebaseAuthentication(actions.firebaseAuthentication({
            uid: 'testuser',
            expires: 1,
            token: 'validtoken'
          }));

          expect(generator.next().value).toEqual(call(sagas.isAdmin, 'testuser'));
          expect(generator.next(false).value).toEqual(call(sagas.getName, 'testuser'));
          expect(generator.next('Hans Muster').value).toEqual(put(actions.firebaseAuthenticationEvent({
            admin: false,
            expiration: 1000,
            token: 'validtoken',
            uid: 'testuser',
            name: 'Hans Muster'
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
    });
  });
});
