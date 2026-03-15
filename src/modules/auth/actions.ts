export const REQUEST_IP_AUTHENTICATION = 'REQUEST_IP_AUTHENTICATION' as const;
export const IP_AUTHENTICATION_FAILURE = 'IP_AUTHENTICATION_FAILURE' as const;
export const REQUEST_USERNAME_PASSWORD_AUTHENTICATION = 'REQUEST_USERNAME_PASSWORD_AUTHENTICATION' as const;
export const USERNAME_PASSWORD_AUTHENTICATION_FAILURE = 'USERNAME_PASSWORD_AUTHENTICATION_FAILURE' as const;
export const REQUEST_GUEST_TOKEN_AUTHENTICATION = 'REQUEST_GUEST_TOKEN_AUTHENTICATION' as const;
export const GUEST_TOKEN_AUTHENTICATION_FAILURE = 'GUEST_TOKEN_AUTHENTICATION_FAILURE' as const;
export const REQUEST_KIOSK_TOKEN_AUTHENTICATION = 'REQUEST_KIOSK_TOKEN_AUTHENTICATION' as const;
export const KIOSK_TOKEN_AUTHENTICATION_FAILURE = 'KIOSK_TOKEN_AUTHENTICATION_FAILURE' as const;
export const SEND_AUTHENTICATION_EMAIL = 'SEND_AUTHENTICATION_EMAIL' as const;
export const SEND_AUTHENTICATION_EMAIL_SUCCESS = 'SEND_AUTHENTICATION_EMAIL_SUCCESS' as const;
export const SEND_AUTHENTICATION_EMAIL_FAILURE = 'SEND_AUTHENTICATION_EMAIL_FAILURE' as const;
export const COMPLETE_EMAIL_AUTHENTICATION = 'COMPLETE_EMAIL_AUTHENTICATION' as const;
export const EMAIL_AUTHENTICATION_COMPLETION_FAILURE = 'EMAIL_AUTHENTICATION_COMPLETION_FAILURE' as const;
export const REQUEST_EMAIL_AUTHENTICATION = 'REQUEST_EMAIL_AUTHENTICATION' as const;
export const REQUEST_FIREBASE_AUTHENTICATION = 'REQUEST_FIREBASE_AUTHENTICATION' as const;
export const FIREBASE_AUTHENTICATION = 'FIREBASE_AUTHENTICATION' as const;
export const LOGOUT = 'LOGOUT' as const;
export const FIREBASE_AUTHENTICATION_EVENT = 'FIREBASE_AUTHENTICATION_EVENT' as const;
export const SET_SUBMITTING = 'SET_SUBMITTING' as const;

export type AuthAction =
  | { type: typeof REQUEST_IP_AUTHENTICATION }
  | { type: typeof IP_AUTHENTICATION_FAILURE }
  | { type: typeof REQUEST_USERNAME_PASSWORD_AUTHENTICATION; payload: { username: string; password: string } }
  | { type: typeof USERNAME_PASSWORD_AUTHENTICATION_FAILURE }
  | { type: typeof REQUEST_GUEST_TOKEN_AUTHENTICATION; payload: { token: string } }
  | { type: typeof GUEST_TOKEN_AUTHENTICATION_FAILURE }
  | { type: typeof REQUEST_KIOSK_TOKEN_AUTHENTICATION; payload: { token: string } }
  | { type: typeof KIOSK_TOKEN_AUTHENTICATION_FAILURE }
  | { type: typeof SEND_AUTHENTICATION_EMAIL; payload: { email: string; local: boolean } }
  | { type: typeof SEND_AUTHENTICATION_EMAIL_SUCCESS }
  | { type: typeof SEND_AUTHENTICATION_EMAIL_FAILURE }
  | { type: typeof COMPLETE_EMAIL_AUTHENTICATION; payload: { email: string } }
  | { type: typeof EMAIL_AUTHENTICATION_COMPLETION_FAILURE }
  | { type: typeof REQUEST_EMAIL_AUTHENTICATION }
  | { type: typeof REQUEST_FIREBASE_AUTHENTICATION; payload: { token: string; failureAction?: AuthAction; local?: boolean } }
  | { type: typeof FIREBASE_AUTHENTICATION; payload: { authData: unknown } }
  | { type: typeof LOGOUT }
  | { type: typeof FIREBASE_AUTHENTICATION_EVENT; payload: { authData: unknown } }
  | { type: typeof SET_SUBMITTING };

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

export function authenticate(username: string, password: string) {
  return {
    type: REQUEST_USERNAME_PASSWORD_AUTHENTICATION,
    payload: {
      username,
      password,
    },
  };
}

export function authenticateAsGuest(token: string) {
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

export function authenticateAsKiosk(token: string) {
  return {
    type: REQUEST_KIOSK_TOKEN_AUTHENTICATION,
    payload: {
      token
    },
  };
}

export function kioskTokenAuthenticationFailure() {
  return {
    type: KIOSK_TOKEN_AUTHENTICATION_FAILURE,
  };
}

export function sendAuthenticationEmail(email: string, local: boolean) {
  return {
    type: SEND_AUTHENTICATION_EMAIL,
    payload: {
      email,
      local
    },
  };
}

export function completeEmailAuthentication(email: string) {
  return {
    type: COMPLETE_EMAIL_AUTHENTICATION,
    payload: {
      email,
    },
  };
}

export function emailAuthenticationCompletionFailure() {
  return {
    type: EMAIL_AUTHENTICATION_COMPLETION_FAILURE,
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

export function requestFirebaseAuthentication(token: string, failureAction?: AuthAction, local?: boolean) {
  return {
    type: REQUEST_FIREBASE_AUTHENTICATION,
    payload: {
      token,
      failureAction,
      local
    },
  };
}

export function firebaseAuthenticationEvent(authData: unknown) {
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

export function firebaseAuthentication(authData: unknown) {
  return {
    type: FIREBASE_AUTHENTICATION,
    payload: {
      authData,
    },
  };
}
