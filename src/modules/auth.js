import { takeEvery, takeLatest } from 'redux-saga';
import { call, put, fork } from 'redux-saga/effects'
import auth from '../util/auth';
import createChannel from '../util/createChannel';
import firebase, { authenticate as fbAuth, unauth as fbUnauth } from '../util/firebase.js';

export const REQUEST_IP_AUTHENTICATION = 'REQUEST_IP_AUTHENTICATION';
export const IP_AUTHENTICATION_FAILURE = 'IP_AUTHENTICATION_FAILURE';

export const REQUEST_USERNAME_PASSWORD_AUTHENTICATION = 'REQUEST_USERNAME_PASSWORD_AUTHENTICATION';
export const USERNAME_PASSWORD_AUTHENTICATION_FAILURE = 'USERNAME_PASSWORD_AUTHENTICATION_FAILURE';

export const REQUEST_FIREBASE_AUTHENTICATION = 'REQUEST_FIREBASE_AUTHENTICATION';
export const FIREBASE_AUTHENTICATION = 'FIREBASE_AUTHENTICATION';

export const LOGOUT = 'LOGOUT';

export const FIREBASE_AUTHENTICATION_EVENT = 'FIREBASE_AUTHENTICATION_EVENT';

export const SET_SUBMITTING = 'SET_SUBMITTING';


function requestIpAuthentication() {
  return {
    type: REQUEST_IP_AUTHENTICATION,
  };
}

function ipAuthenticationFailure() {
  return {
    type: IP_AUTHENTICATION_FAILURE,
  };
}

export function authenticate(username, password) {
  return {
    type: REQUEST_USERNAME_PASSWORD_AUTHENTICATION,
    payload: {
      username,
      password
    }
  };
}

export function logout() {
  return {
    type: LOGOUT,
  };
}

function usernamePasswordAuthenticationFailure() {
  return {
    type: USERNAME_PASSWORD_AUTHENTICATION_FAILURE,
  };
}

function requestFirebaseAuthentication(token) {
  return {
    type: REQUEST_FIREBASE_AUTHENTICATION,
    payload: {
      token,
    }
  };
}

function firebaseAuthenticationEvent(authData) {
  return {
    type: FIREBASE_AUTHENTICATION_EVENT,
    payload: {
      authData,
    }
  };
}

function setSubmitting() {
  return {
    type: SET_SUBMITTING,
  };
}

function firebaseAuthentication(authData) {
  return {
    type: FIREBASE_AUTHENTICATION,
    payload: {
      authData,
    },
  }
}

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
  const ipToken = yield call(auth.loadIpToken);
  if (ipToken) {
    yield put(requestFirebaseAuthentication(ipToken));
  } else {
    yield put(ipAuthenticationFailure());
  }
}

function* doUsernamePasswordAuthentication(action) {
  yield put(setSubmitting());
  const { username, password } = action.payload;
  if (isNotEmptyString(username) && isNotEmptyString(password)) {
    const credentials = {username, password};
    const credentialsToken = yield call(auth.loadCredentialsToken(credentials));
    if (credentialsToken) {
      yield put(requestFirebaseAuthentication(credentialsToken));
    } else {
      yield put(usernamePasswordAuthenticationFailure());
    }
  } else {
    yield put(usernamePasswordAuthenticationFailure());
  }
}

function* doFirebaseAuthentication(action) {
  yield call(fbAuth(action.payload.token));
}

function* doLogout() {
  yield call(fbUnauth());
}

function* doListenFirebaseAuthentication(action) {
  const authenticated = !!action.payload.authData;

  const authData = authenticated ? {
    uid: action.payload.authData.uid,
    expiration: (action.payload.authData.expires * 1000),
    token: action.payload.authData.token,
    admin: yield call(isAdmin(action.payload.authData.uid))
  } : null;

  yield put(firebaseAuthenticationEvent(authData));

  if (!authenticated) {
    yield put(requestIpAuthentication());
  }
}

function isNotEmptyString(str) {
  return typeof str === 'string' && str.length > 0;
}

function* monitorFirebaseAuthentication(channel) {
  while (true) {
    const authData = yield call(channel.take);
    yield put(firebaseAuthentication(authData));
  }
}

function createFbAuthenticationChannel() {
  const channel = createChannel();
  firebase((error, ref) => {
    ref.onAuth(channel.put);
  });
  return channel;
}

export function* sagas() {
  yield [
    fork(takeEvery, REQUEST_IP_AUTHENTICATION, doIpAuthentication),
    fork(takeEvery, REQUEST_USERNAME_PASSWORD_AUTHENTICATION, doUsernamePasswordAuthentication),
    fork(takeEvery, REQUEST_FIREBASE_AUTHENTICATION, doFirebaseAuthentication),
    fork(takeEvery, LOGOUT, doLogout),
    fork(takeEvery, FIREBASE_AUTHENTICATION, doListenFirebaseAuthentication),
    fork(monitorFirebaseAuthentication, createFbAuthenticationChannel()),
  ]
}

const ACTION_HANDLERS = {
  SET_SUBMITTING: state => {
    return Object.assign({}, state, {
      submitting: true,
      failure: false,
    });
  },
  USERNAME_PASSWORD_AUTHENTICATION_FAILURE: state => {
    return Object.assign({}, state, {
      submitting: false,
      failure: true,
    });
  },
  IP_AUTHENTICATION_FAILURE: state => {
    return Object.assign({}, state, {
      initialized: true,
    });
  },
  FIREBASE_AUTHENTICATION_EVENT: (state, action) => {
    if (action.payload.authData) {
      return {
        initialized: true,
        authenticated: true,
        failure: false,
        submitting: false,
        data: action.payload.authData,
      }
    }
    return INITIAL_STATE;
  }
};

const INITIAL_STATE = {
  initialized: false,
  authenticated: false,
  submitting: false,
  failure: false,
};

const reducer = (state = INITIAL_STATE, action) => {
  const handler = ACTION_HANDLERS[action.type];
  if (handler) {
    return handler(state, action);
  }
  return state;
};

export default reducer;
