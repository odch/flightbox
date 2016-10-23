import * as actions from './actions';
import { FIREBASE_AUTHENTICATION_EVENT } from '../../auth';
import reducer from '../../../util/reducer';

const INITIAL_STATE = false;

function showLogin() {
  return true;
}

function hideLogin() {
  return false;
}

function firebaseAuthenticationEvent(state, action) {
  if (!!action.payload.authData) {
    return false;
  }
  return state;
}

const ACTION_HANDLERS = {
  [actions.SHOW_LOGIN]: showLogin,
  [actions.HIDE_LOGIN]: hideLogin,
  [FIREBASE_AUTHENTICATION_EVENT]: firebaseAuthenticationEvent,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
