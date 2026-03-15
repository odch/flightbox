import * as actions from './actions';
import { FIREBASE_AUTHENTICATION_EVENT } from '../../auth';
import reducer from '../../../util/reducer';

type ShowLoginState = boolean;

const INITIAL_STATE: ShowLoginState = false;

function showLogin() {
  return true;
}

function hideLogin() {
  return false;
}

function firebaseAuthenticationEvent(state: ShowLoginState, action: any) {
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

export type { ShowLoginState };
export default reducer(INITIAL_STATE, ACTION_HANDLERS);
