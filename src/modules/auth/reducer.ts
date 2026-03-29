import * as actions from './actions';
import { AuthAction } from './actions';
import reducer from '../../util/reducer';

interface GuestAuthState {
  submitting: boolean;
  failure: boolean;
}

interface AuthState {
  initialized: boolean;
  authenticated: boolean;
  submitting: boolean;
  failure: boolean;
  otpVerificationFailure?: boolean;
  guestAuthentication: GuestAuthState;
  data?: unknown;
}

const INITIAL_STATE: AuthState = {
  initialized: false,
  authenticated: false,
  submitting: false,
  failure: false,
  otpVerificationFailure: false,
  guestAuthentication: {
    submitting: false,
    failure: false
  }
};

const ACTION_HANDLERS = {
  [actions.SET_SUBMITTING]: (state: AuthState) => {
    return Object.assign({}, state, {
      submitting: true,
      failure: false,
      otpVerificationFailure: false,
    });
  },
  [actions.SEND_AUTHENTICATION_EMAIL_SUCCESS]: (state: AuthState) => {
    return Object.assign({}, state, {
      submitting: false,
    });
  },
  [actions.SEND_AUTHENTICATION_EMAIL_FAILURE]: (state: AuthState) => {
    return Object.assign({}, state, {
      submitting: false,
      failure: true,
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
  [actions.IP_AUTHENTICATION_FAILURE]: (state: AuthState) => {
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
        guestAuthentication: INITIAL_STATE.guestAuthentication
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
};

export type { AuthState };
export default reducer<AuthState, AuthAction>(INITIAL_STATE, ACTION_HANDLERS);
