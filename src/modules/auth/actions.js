export const REQUEST_IP_AUTHENTICATION = 'REQUEST_IP_AUTHENTICATION';
export const IP_AUTHENTICATION_FAILURE = 'IP_AUTHENTICATION_FAILURE';

export const REQUEST_USERNAME_PASSWORD_AUTHENTICATION = 'REQUEST_USERNAME_PASSWORD_AUTHENTICATION';
export const USERNAME_PASSWORD_AUTHENTICATION_FAILURE = 'USERNAME_PASSWORD_AUTHENTICATION_FAILURE';

export const REQUEST_GUEST_TOKEN_AUTHENTICATION = 'REQUEST_GUEST_TOKEN_AUTHENTICATION';
export const GUEST_TOKEN_AUTHENTICATION_FAILURE = 'GUEST_TOKEN_AUTHENTICATION_FAILURE';

export const SEND_AUTHENTICATION_EMAIL = 'SEND_AUTHENTICATION_EMAIL';
export const SEND_AUTHENTICATION_EMAIL_SUCCESS = 'SEND_AUTHENTICATION_EMAIL_SUCCESS';
export const SEND_AUTHENTICATION_EMAIL_FAILURE = 'SEND_AUTHENTICATION_EMAIL_FAILURE';

export const REQUEST_EMAIL_AUTHENTICATION = 'REQUEST_EMAIL_AUTHENTICATION';

export const REQUEST_FIREBASE_AUTHENTICATION = 'REQUEST_FIREBASE_AUTHENTICATION';
export const FIREBASE_AUTHENTICATION = 'FIREBASE_AUTHENTICATION';

export const LOGOUT = 'LOGOUT';

export const FIREBASE_AUTHENTICATION_EVENT = 'FIREBASE_AUTHENTICATION_EVENT';

export const SET_SUBMITTING = 'SET_SUBMITTING';

export function requestIpAuthentication() {
  return {
    type: REQUEST_IP_AUTHENTICATION,
  };
}

export function ipAuthenticationFailure() {
  return {
    type: IP_AUTHENTICATION_FAILURE,
  };
}

export function requestEmailAuthentication() {
  return {
    type: REQUEST_EMAIL_AUTHENTICATION,
  };
}

export function authenticate(username, password) {
  return {
    type: REQUEST_USERNAME_PASSWORD_AUTHENTICATION,
    payload: {
      username,
      password,
    },
  };
}

export function authenticateAsGuest(token) {
  return {
    type: REQUEST_GUEST_TOKEN_AUTHENTICATION,
    payload: {
      token
    },
  };
}

export function guestTokenAuthenticationFailure() {
  return {
    type: GUEST_TOKEN_AUTHENTICATION_FAILURE,
  };
}

export function sendAuthenticationEmail(email) {
  return {
    type: SEND_AUTHENTICATION_EMAIL,
    payload: {
      email
    },
  };
}

export function sendAuthenticationEmailSuccess() {
  return {
    type: SEND_AUTHENTICATION_EMAIL_SUCCESS,
  };
}

export function sendAuthenticationEmailFailure() {
  return {
    type: SEND_AUTHENTICATION_EMAIL_FAILURE,
  };
}

export function logout() {
  return {
    type: LOGOUT,
  };
}

export function usernamePasswordAuthenticationFailure() {
  return {
    type: USERNAME_PASSWORD_AUTHENTICATION_FAILURE,
  };
}

export function requestFirebaseAuthentication(token, failureAction) {
  return {
    type: REQUEST_FIREBASE_AUTHENTICATION,
    payload: {
      token,
      failureAction
    },
  };
}

export function firebaseAuthenticationEvent(authData) {
  return {
    type: FIREBASE_AUTHENTICATION_EVENT,
    payload: {
      authData,
    },
  };
}

export function setSubmitting() {
  return {
    type: SET_SUBMITTING,
  };
}

export function firebaseAuthentication(authData) {
  return {
    type: FIREBASE_AUTHENTICATION,
    payload: {
      authData,
    },
  };
}
