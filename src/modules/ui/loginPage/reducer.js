import * as actions from './actions';
import {FIREBASE_AUTHENTICATION_EVENT, USERNAME_PASSWORD_AUTHENTICATION_FAILURE} from '../../auth';
import reducer from '../../../util/reducer';
import {SEND_AUTHENTICATION_EMAIL_SUCCESS} from '../../auth/actions'

const INITIAL_STATE = {
  username: '',
  password: '',
  email: '',
  submitting: false,
  failure: false,
  emailSent: false
};

function updateUsername(state, action) {
  return Object.assign({}, state, {
    username: action.payload.username,
  });
}

function updatePassword(state, action) {
  return Object.assign({}, state, {
    password: action.payload.password,
  });
}

function updateEmail(state, action) {
  return {
    ...state,
    email: action.payload.email,
  };
}

function setEmailSent(state) {
  return {
    ...state,
    emailSent: true
  };
}

function usernamePasswordAuthenticationFailure(state) {
  return Object.assign({}, state, {
    password: '',
  });
}

function firebaseAuthenticationEvent(state) {
  return Object.assign({}, state, {
    username: '',
    password: '',
  });
}

const ACTION_HANDLERS = {
  [actions.UPDATE_USERNAME]: updateUsername,
  [actions.UPDATE_PASSWORD]: updatePassword,
  [actions.UPDATE_EMAIL]: updateEmail,
  [USERNAME_PASSWORD_AUTHENTICATION_FAILURE]: usernamePasswordAuthenticationFailure,
  [FIREBASE_AUTHENTICATION_EVENT]: firebaseAuthenticationEvent,
  [SEND_AUTHENTICATION_EMAIL_SUCCESS]: setEmailSent,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
