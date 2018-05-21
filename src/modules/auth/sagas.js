import { takeEvery, takeLatest } from 'redux-saga';
import { call, put, fork } from 'redux-saga/effects'
import * as actions from './actions';
import { loadIpToken, loadCredentialsToken } from '../../util/auth';
import createChannel from '../../util/createChannel';
import firebase, { authenticate as fbAuth, unauth as fbUnauth, watchAuthState } from '../../util/firebase';
import { error as logError } from '../../util/log';

function isAdmin(uid) {
  return () => new Promise((resolve, reject) => {
    firebase('/admins/' + uid, (error, ref) => {
      if (error) {
        reject(error);
      } else {
        ref.once('value', snapshot => {
          resolve(snapshot.exists());
        }, () => {
          resolve(false);
        });
      }
    });
  });
}

function* doIpAuthentication() {
  try {
    const ipToken = yield call(loadIpToken);
    if (ipToken) {
      yield put(actions.requestFirebaseAuthentication(ipToken));
    } else {
      yield put(actions.ipAuthenticationFailure());
    }
  } catch(e) {
    error('Failed to execute IP authentication', e);
    yield put(actions.ipAuthenticationFailure());
  }
}

function* doUsernamePasswordAuthentication(action) {
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
    error('Failed to execute credentials authentication', e);
    yield put(actions.usernamePasswordAuthenticationFailure());
  }
}

function* doFirebaseAuthentication(action) {
  try {
    yield call(fbAuth, action.payload.token);
  } catch (e) {
    logError('Firebase authentication failed', e);
    yield put(action.payload.failureAction);
  }
}

function* doLogout() {
  yield call(fbUnauth());
}

function* doListenFirebaseAuthentication(action) {
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
      authData = {
        uid,
        expiration: expires * 1000,
        token,
        admin: yield call(isAdmin(uid)),
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
