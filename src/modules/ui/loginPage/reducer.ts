import * as actions from './actions';
import {FIREBASE_AUTHENTICATION_EVENT, USERNAME_PASSWORD_AUTHENTICATION_FAILURE} from '../../auth';
import reducer from '../../../util/reducer';
import {SEND_AUTHENTICATION_EMAIL_FAILURE, SEND_AUTHENTICATION_EMAIL_SUCCESS} from '../../auth/actions'

interface LoginPageState {
  username: string;
  password: string;
  email: string;
  submitting: boolean;
  failure: boolean;
  emailSent: boolean;
}

const INITIAL_STATE: LoginPageState = {
  username: '',
  password: '',
  email: '',
  submitting: false,
  failure: false,
  emailSent: false
};

function updateUsername(state: LoginPageState, action: any) {
  return Object.assign({}, state, {
    username: action.payload.username,
  });
}

function updatePassword(state: LoginPageState, action: any) {
  return Object.assign({}, state, {
    password: action.payload.password,
  });
}

function updateEmail(state: LoginPageState, action: any) {
  return {
    ...state,
    email: action.payload.email,
  };
}

function setEmailSent(state: LoginPageState) {
  return {
    ...state,
    emailSent: true
  };
}

function resetOtp(state: LoginPageState) {
  return {
    ...state,
    emailSent: false,
  };
}

function sendAuthenticationEmailFailure(state: LoginPageState) {
  return {
    ...state,
    emailSent: false,
  };
}

function usernamePasswordAuthenticationFailure(state: LoginPageState) {
  return Object.assign({}, state, {
    password: '',
  });
}

function firebaseAuthenticationEvent(_state: LoginPageState) {
  return {
    ...INITIAL_STATE
  }
}

const ACTION_HANDLERS = {
  [actions.UPDATE_USERNAME]: updateUsername,
  [actions.UPDATE_PASSWORD]: updatePassword,
  [actions.UPDATE_EMAIL]: updateEmail,
  [actions.RESET_OTP]: resetOtp,
  [USERNAME_PASSWORD_AUTHENTICATION_FAILURE]: usernamePasswordAuthenticationFailure,
  [FIREBASE_AUTHENTICATION_EVENT]: firebaseAuthenticationEvent,
  [SEND_AUTHENTICATION_EMAIL_SUCCESS]: setEmailSent,
  [SEND_AUTHENTICATION_EMAIL_FAILURE]: sendAuthenticationEmailFailure,
};

export type { LoginPageState };
export default reducer(INITIAL_STATE, ACTION_HANDLERS);
