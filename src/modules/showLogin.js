import { FIREBASE_AUTHENTICATION_EVENT } from './auth';

export const SHOW_LOGIN = 'SHOW_LOGIN';
export const HIDE_LOGIN = 'HIDE_LOGIN';

export function showLogin() {
  return {
    type: SHOW_LOGIN,
  };
}

export function hideLogin() {
  return {
    type: HIDE_LOGIN,
  };
}

const reducer = (state = false, action) => {
  switch (action.type) {
    case SHOW_LOGIN:
      return true;
    case HIDE_LOGIN:
      return false;
    case FIREBASE_AUTHENTICATION_EVENT:
      if (!!action.payload.authData) {
        return false;
      }
      return state;
    default:
      return state;
  }
};

export default reducer;
