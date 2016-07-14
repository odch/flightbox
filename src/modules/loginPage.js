import { USERNAME_PASSWORD_AUTHENTICATION_FAILURE, FIREBASE_AUTHENTICATION_EVENT } from './auth';

export const UPDATE_USERNAME = 'UPDATE_USERNAME';
export const UPDATE_PASSWORD = 'UPDATE_PASSWORD';

export function updateUsername(username) {
  return {
    type: UPDATE_USERNAME,
    username,
  };
}

export function updatePassword(password) {
  return {
    type: UPDATE_PASSWORD,
    password,
  };
}

const INITIAL_STATE = {
  username: '',
  password: '',
  submitting: false,
  failure: false,
};

const reducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_USERNAME:
      return Object.assign({}, state, {
        username: action.username,
      });
    case UPDATE_PASSWORD:
      return Object.assign({}, state, {
        password: action.password,
      });
    case USERNAME_PASSWORD_AUTHENTICATION_FAILURE:
      return Object.assign({}, state, {
        password: '',
      });
    case FIREBASE_AUTHENTICATION_EVENT:
      return Object.assign({}, state, {
        username: '',
        password: '',
      });
    default:
      return state;
  }
};

export default reducer;
