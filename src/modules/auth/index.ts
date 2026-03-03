import {
  authenticate,
  authenticateAsGuest,
  completeEmailAuthentication,
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
  authenticateAsGuest,
  sendAuthenticationEmail,
  completeEmailAuthentication,
  logout
};

export {sagas};

export default reducer;
