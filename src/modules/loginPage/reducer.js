import * as actions from './actions';
import { USERNAME_PASSWORD_AUTHENTICATION_FAILURE, FIREBASE_AUTHENTICATION_EVENT } from '../auth';
import reducer from '../../util/reducer';

const INITIAL_STATE = {
  username: '',
  password: '',
  submitting: false,
  failure: false,
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
  [USERNAME_PASSWORD_AUTHENTICATION_FAILURE]: usernamePasswordAuthenticationFailure,
  [FIREBASE_AUTHENTICATION_EVENT]: firebaseAuthenticationEvent,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
