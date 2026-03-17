import {all, call, fork, put, takeEvery} from 'redux-saga/effects'
import {get, query, orderByChild, equalTo, limitToFirst} from 'firebase/database';
import * as actions from './actions';
import {loadCredentialsToken, loadGuestToken, loadIpToken, loadKioskToken} from '../../util/auth';
import createChannel from '../../util/createChannel';
import firebase, {
  authenticate as fbAuth,
  requestSignInCode as fbRequestSignInCode,
  verifyOtpCode as fbVerifyOtpCode,
  unauth as fbUnauth,
  watchAuthState
} from '../../util/firebase';
import {error as logError} from '../../util/log';
import {getKioskAuthQueryToken} from '../../util/getAuthQueryToken'

export function getLoginData(uid: string) {
  return get(firebase('/logins/' + uid))
    .then(snapshot => {
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    })
    .catch(() => null);
}

export const findByMemberNr = (dbRef: any, uid: string) =>
  get(query(dbRef, orderByChild('memberNr'), equalTo(uid), limitToFirst(1)));

export function* loadUser(uid: string) {
  const usersRef = yield call(firebase, '/users');
  const snapshot = yield call(findByMemberNr, usersRef, uid)
  const map = snapshot.val()
  const arr = map ? Object.values(map) : []
  return arr.length > 0 ? arr[0] : null
}

export function* getName(uid: string) {
  const user = yield call(loadUser, uid)
  return user ? `${(user as any).firstname} ${(user as any).lastname}` : null
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

export function* doUsernamePasswordAuthentication(action: any) {
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

export function* sendAuthenticationEmail(action: any) {
  try {
    yield put(actions.setSubmitting());
    const { email, local } = action.payload;

    if (isNotEmptyString(email)) {
      window.localStorage.setItem('isLocalSignIn', String(local));

      const result = yield call(fbRequestSignInCode, email);

      const airportName = __CONF__.aerodrome.name;
      const theme = require(`../../../theme/${__CONF__.theme}`);
      const emailFunctionUrl = `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/sendSignInEmail`;

      const emailRequest = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: result.email,
          signInCode: result.code,
          airportName: airportName,
          themeColor: theme.colors.main
        })
      };

      const emailResponse = yield call(fetch, emailFunctionUrl, emailRequest);

      if (!emailResponse.ok) {
        const errorData = yield call([emailResponse, 'json']);
        throw new Error(errorData.error || 'Failed to send authentication email');
      }

      yield put(actions.sendAuthenticationEmailSuccess());
    }
  } catch(e) {
    logError('Failed to send authentication email', e);
    yield put(actions.sendAuthenticationEmailFailure());
  }
}

export function* doVerifyOtpCode(action: any) {
  try {
    yield put(actions.setSubmitting());
    const { email, code } = action.payload;
    const token = yield call(fbVerifyOtpCode, email, code);
    yield put(actions.requestFirebaseAuthentication(token, actions.otpVerificationFailure()));
  } catch(e) {
    logError('Failed to verify OTP code', e);
    yield put(actions.otpVerificationFailure());
  }
}

export function* doGuestTokenAuthentication(action: any) {
  try {
    const queryToken = action.payload.token
    const guestToken = yield call(loadGuestToken, queryToken);
    if (guestToken) {
      yield put(actions.requestFirebaseAuthentication(
        guestToken,
        actions.guestTokenAuthenticationFailure()
      ));
    } else {
      yield put(actions.guestTokenAuthenticationFailure());
    }
  } catch (e) {
    logError('Login with guest token failed', e)
    yield put(actions.guestTokenAuthenticationFailure())
  }
}

export function* doKioskTokenAuthentication(action: any) {
  try {
    const queryToken = action.payload.token
    const kioskToken = yield call(loadKioskToken, queryToken);
    if (kioskToken) {
      yield put(actions.requestFirebaseAuthentication(
        kioskToken,
        actions.kioskTokenAuthenticationFailure()
      ));
    } else {
      yield put(actions.kioskTokenAuthenticationFailure());
    }
  } catch (e) {
    logError('Login with kiosk token failed', e)
    yield put(actions.kioskTokenAuthenticationFailure())
  }
}

export function* doFirebaseAuthentication(action: any) {
  try {
    yield call(fbAuth, action.payload.token);
  } catch (e) {
    logError('Firebase authentication failed', e);
    yield put(action.payload.failureAction);
  }
}

export function* doLogout() {
  yield call(fbUnauth);
  window.location.href = '/'
}

export function* doListenFirebaseAuthentication(action: any) {
  const authenticated = !!action.payload.authData;

  let authData: any = null;

  if (authenticated) {
    const { uid, expires, token, email } = action.payload.authData;

    if (uid === 'ipauth') {
      authData = {
        expiration: expires * 1000,
        token,
        local: true
      }
    } else {
      const loginData = yield call(getLoginData, uid)
      const guest = uid === 'guest'
      const kiosk = uid === 'kiosk'
      const local = guest || kiosk || window.localStorage.getItem('isLocalSignIn') === 'true'
      authData = {
        uid,
        expiration: expires * 1000,
        token,
        admin: loginData && loginData.admin === true,
        guest,
        kiosk,
        local,
        links: !loginData || loginData.links !== false,
        name: yield call(getName, uid),
        email
      }
    }
  }

  yield put(actions.firebaseAuthenticationEvent(authData));

  if (!authenticated) {
    if (isSignInWithKioskAccessToken()) {
      yield put(actions.authenticateAsKiosk(getKioskAuthQueryToken(window.location)!))
    } else {
      yield put(actions.requestIpAuthentication());
    }
  }
}

function isSignInWithKioskAccessToken() {
  return !!getKioskAuthQueryToken(window.location)
}

function isNotEmptyString(str: unknown): str is string {
  return typeof str === 'string' && str.length > 0;
}

function* monitorFirebaseAuthentication(channel: any) {
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
  yield all([
    takeEvery(actions.REQUEST_IP_AUTHENTICATION, doIpAuthentication),
    takeEvery(actions.REQUEST_USERNAME_PASSWORD_AUTHENTICATION, doUsernamePasswordAuthentication),
    takeEvery(actions.REQUEST_GUEST_TOKEN_AUTHENTICATION, doGuestTokenAuthentication),
    takeEvery(actions.REQUEST_KIOSK_TOKEN_AUTHENTICATION, doKioskTokenAuthentication),
    takeEvery(actions.SEND_AUTHENTICATION_EMAIL, sendAuthenticationEmail),
    takeEvery(actions.VERIFY_OTP_CODE, doVerifyOtpCode),
    takeEvery(actions.REQUEST_FIREBASE_AUTHENTICATION, doFirebaseAuthentication),
    takeEvery(actions.LOGOUT, doLogout),
    takeEvery(actions.FIREBASE_AUTHENTICATION, doListenFirebaseAuthentication),
    fork(monitorFirebaseAuthentication, createFbAuthenticationChannel()),
  ])
}
