import { takeEvery } from 'redux-saga';
import { call, put, fork } from 'redux-saga/effects'
import * as actions from './actions';
import { loadIpToken, loadCredentialsToken } from '../../util/auth';
import createChannel from '../../util/createChannel';
import firebase, { authenticate as fbAuth, unauth as fbUnauth, watchAuthState } from '../../util/firebase';
import { error as logError } from '../../util/log';

export function getLoginData(uid) {
  return new Promise((resolve, reject) => {
    firebase('/logins/' + uid, (error, ref) => {
      if (error) {
        reject(error);
      } else {
        ref.once('value', snapshot => {
          if (snapshot.exists()) {
            resolve(snapshot.val());
          } else {
            resolve(null);
          }
        }, () => {
          resolve(null);
        });
      }
    });
  });
}

export const findByMemberNr = (usersRef, uid) =>
  usersRef.orderByChild('memberNr').equalTo(uid).limitToFirst(1).once('value')

export function* loadUser(uid) {
  const usersRef = yield call(firebase, '/users');
  const snapshot = yield call(findByMemberNr, usersRef, uid)
  const map = snapshot.val()
  const arr = map ? Object.values(map) : []
  return arr.length > 0 ? arr[0] : null
}

export function* getName(uid) {
  const user = yield call(loadUser, uid)
  return user ? `${user.firstname} ${user.lastname}` : null
}

export function* doIpAuthentication() {
  try {
    if (__DISABLE_IP_AUTHENTICATION__) {
      yield put(actions.ipAuthenticationFailure());
    } else {
      const ipToken = yield call(loadIpToken);
      if (ipToken) {
        yield put(actions.requestFirebaseAuthentication(ipToken));
      } else {
        yield put(actions.ipAuthenticationFailure());
      }
    }
  } catch(e) {
    logError('Failed to execute IP authentication', e);
    yield put(actions.ipAuthenticationFailure());
  }
}

export function* doUsernamePasswordAuthentication(action) {
  try {
    yield put(actions.setSubmitting());
    const { username, password } = action.payload;
    if (isNotEmptyString(username) && isNotEmptyString(password)) {
      const credentials = {username, password};
      const credentialsToken = yield call(loadCredentialsToken, credentials);
      if (credentialsToken) {
        yield put(actions.requestFirebaseAuthentication(
          credentialsToken,
          actions.usernamePasswordAuthenticationFailure()
        ));
      } else {
        yield put(actions.usernamePasswordAuthenticationFailure());
      }
    } else {
      yield put(actions.usernamePasswordAuthenticationFailure());
    }
  } catch(e) {
    logError('Failed to execute credentials authentication', e);
    yield put(actions.usernamePasswordAuthenticationFailure());
  }
}

export function* doFirebaseAuthentication(action) {
  try {
    yield call(fbAuth, action.payload.token);
  } catch (e) {
    logError('Firebase authentication failed', e);
    yield put(action.payload.failureAction);
  }
}

export function* doLogout() {
  yield call(fbUnauth);
}

export function* doListenFirebaseAuthentication(action) {
  const authenticated = !!action.payload.authData;

  let authData = null;

  if (authenticated) {
    const { uid, expires, token } = action.payload.authData;

    if (uid === 'ipauth') {
      authData = {
        expiration: expires * 1000,
        token,
      }
    } else {
      const loginData = yield call(getLoginData, uid)
      authData = {
        uid,
        expiration: expires * 1000,
        token,
        admin: loginData && loginData.admin === true,
        links: !loginData || loginData.links !== false,
        name: yield call(getName, uid)
      }
    }
  }

  yield put(actions.firebaseAuthenticationEvent(authData));

  if (!authenticated) {
    yield put(actions.requestIpAuthentication());
  }
}

function isNotEmptyString(str) {
  return typeof str === 'string' && str.length > 0;
}

function* monitorFirebaseAuthentication(channel) {
  while (true) {
    const authData = yield call(channel.take);
    yield put(actions.firebaseAuthentication(authData));
  }
}

function createFbAuthenticationChannel() {
  try {
    const channel = createChannel();
    watchAuthState(channel.put);
    return channel;
  } catch(e) {
    logError('Failed to create authentication watch channel', e);
  }
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.REQUEST_IP_AUTHENTICATION, doIpAuthentication),
    fork(takeEvery, actions.REQUEST_USERNAME_PASSWORD_AUTHENTICATION, doUsernamePasswordAuthentication),
    fork(takeEvery, actions.REQUEST_FIREBASE_AUTHENTICATION, doFirebaseAuthentication),
    fork(takeEvery, actions.LOGOUT, doLogout),
    fork(takeEvery, actions.FIREBASE_AUTHENTICATION, doListenFirebaseAuthentication),
    fork(monitorFirebaseAuthentication, createFbAuthenticationChannel()),
  ]
}
