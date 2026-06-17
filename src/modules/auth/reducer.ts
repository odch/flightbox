import * as actions from './actions';
import { AuthAction, Passkey } from './actions';
import reducer from '../../util/reducer';

interface GuestAuthState {
  submitting: boolean;
  failure: boolean;
}

interface PasskeyRegistrationState {
  submitting: boolean;
  failure: boolean;
  errorMessage?: string;
}

interface PasskeyLoginState {
  submitting: boolean;
  failure: boolean;
}

interface PasskeyRemovalState {
  failure: boolean;
  errorMessage?: string;
}

interface AuthState {
  initialized: boolean;
  authenticated: boolean;
  submitting: boolean;
  failure: boolean;
  emailRateLimited?: boolean;
  otpVerificationFailure?: boolean;
  guestAuthentication: GuestAuthState;
  passkeyRegistration: PasskeyRegistrationState;
  passkeyLogin: PasskeyLoginState;
  passkeyRemoval: PasskeyRemovalState;
  passkeys: Passkey[];
  data?: unknown;
}

const INITIAL_PASSKEY_REGISTRATION: PasskeyRegistrationState = { submitting: false, failure: false };
const INITIAL_PASSKEY_LOGIN: PasskeyLoginState = { submitting: false, failure: false };
const INITIAL_PASSKEY_REMOVAL: PasskeyRemovalState = { failure: false };

const INITIAL_STATE: AuthState = {
  initialized: false,
  authenticated: false,
  submitting: false,
  failure: false,
  emailRateLimited: false,
  otpVerificationFailure: false,
  guestAuthentication: {
    submitting: false,
    failure: false
  },
  passkeyRegistration: INITIAL_PASSKEY_REGISTRATION,
  passkeyLogin: INITIAL_PASSKEY_LOGIN,
  passkeyRemoval: INITIAL_PASSKEY_REMOVAL,
  passkeys: []
};

const ACTION_HANDLERS = {
  [actions.SET_SUBMITTING]: (state: AuthState) => {
    return Object.assign({}, state, {
      submitting: true,
      failure: false,
      emailRateLimited: false,
      otpVerificationFailure: false,
    });
  },
  [actions.SEND_AUTHENTICATION_EMAIL_SUCCESS]: (state: AuthState) => {
    return Object.assign({}, state, {
      submitting: false,
      emailRateLimited: false,
    });
  },
  [actions.SEND_AUTHENTICATION_EMAIL_FAILURE]: (state: AuthState, action: any) => {
    return Object.assign({}, state, {
      submitting: false,
      failure: true,
      emailRateLimited: !!(action.payload && action.payload.rateLimited),
    });
  },
  [actions.REQUEST_GUEST_TOKEN_AUTHENTICATION]: (state: AuthState) => {
    return {
      ...state,
      guestAuthentication: {
        submitting: true,
        failure: false
      }
    }
  },
  [actions.GUEST_TOKEN_AUTHENTICATION_FAILURE]: (state: AuthState) => {
    return {
      ...state,
      guestAuthentication: {
        submitting: false,
        failure: true
      }
    }
  },
  [actions.USERNAME_PASSWORD_AUTHENTICATION_FAILURE]: (state: AuthState) => {
    return Object.assign({}, state, {
      submitting: false,
      failure: true,
    });
  },
  [actions.AUTHENTICATION_INITIALIZED]: (state: AuthState) => {
    return Object.assign({}, state, {
      initialized: true,
    });
  },
  [actions.FIREBASE_AUTHENTICATION_EVENT]: (state: AuthState, action: AuthAction & { type: typeof actions.FIREBASE_AUTHENTICATION_EVENT }) => {
    if (action.payload.authData) {
      return {
        initialized: true,
        authenticated: true,
        failure: false,
        submitting: false,
        data: action.payload.authData,
        guestAuthentication: INITIAL_STATE.guestAuthentication,
        passkeyRegistration: INITIAL_PASSKEY_REGISTRATION,
        passkeyLogin: INITIAL_PASSKEY_LOGIN,
        passkeyRemoval: INITIAL_PASSKEY_REMOVAL,
        passkeys: []
      } as AuthState;
    }
    return INITIAL_STATE;
  },
  [actions.OTP_VERIFICATION_FAILURE]: (state: AuthState) => {
    return {
      ...state,
      submitting: false,
      otpVerificationFailure: true,
    };
  },
  [actions.REGISTER_PASSKEY]: (state: AuthState) => ({
    ...state,
    passkeyRegistration: { submitting: true, failure: false }
  }),
  [actions.REGISTER_PASSKEY_SUCCESS]: (state: AuthState) => ({
    ...state,
    passkeyRegistration: { submitting: false, failure: false }
  }),
  [actions.REGISTER_PASSKEY_FAILURE]: (state: AuthState, action: AuthAction & { type: typeof actions.REGISTER_PASSKEY_FAILURE }) => ({
    ...state,
    passkeyRegistration: { submitting: false, failure: true, errorMessage: action.payload.message }
  }),
  [actions.LOGIN_WITH_PASSKEY]: (state: AuthState) => ({
    ...state,
    passkeyLogin: { submitting: true, failure: false }
  }),
  [actions.LOGIN_WITH_PASSKEY_FAILURE]: (state: AuthState) => ({
    ...state,
    passkeyLogin: { submitting: false, failure: true }
  }),
  [actions.LOAD_PASSKEYS_SUCCESS]: (state: AuthState, action: AuthAction & { type: typeof actions.LOAD_PASSKEYS_SUCCESS }) => ({
    ...state,
    passkeys: action.payload.passkeys
  }),
  [actions.REMOVE_PASSKEY]: (state: AuthState) => ({
    ...state,
    passkeyRemoval: { failure: false }
  }),
  [actions.REMOVE_PASSKEY_SUCCESS]: (state: AuthState, action: AuthAction & { type: typeof actions.REMOVE_PASSKEY_SUCCESS }) => ({
    ...state,
    passkeys: state.passkeys.filter(p => p.credentialId !== action.payload.credentialId),
    passkeyRemoval: { failure: false }
  }),
  [actions.REMOVE_PASSKEY_FAILURE]: (state: AuthState, action: AuthAction & { type: typeof actions.REMOVE_PASSKEY_FAILURE }) => ({
    ...state,
    passkeyRemoval: { failure: true, errorMessage: action.payload.message }
  }),
};

export type { AuthState };
export default reducer<AuthState, AuthAction>(INITIAL_STATE, ACTION_HANDLERS);
