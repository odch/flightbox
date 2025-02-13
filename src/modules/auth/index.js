import {
  authenticate,
  FIREBASE_AUTHENTICATION_EVENT,
  logout,
  sendAuthenticationEmail,
  USERNAME_PASSWORD_AUTHENTICATION_FAILURE
} from './actions';
import reducer from './reducer';
import sagas from './sagas';

export {
  FIREBASE_AUTHENTICATION_EVENT,
  USERNAME_PASSWORD_AUTHENTICATION_FAILURE,
  authenticate,
  sendAuthenticationEmail,
  logout
};

export {sagas};

export default reducer;
