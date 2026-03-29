import {
  authenticate,
  authenticateAsGuest,
  FIREBASE_AUTHENTICATION_EVENT,
  logout,
  sendAuthenticationEmail,
  verifyOtpCode,
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
  verifyOtpCode,
  logout
};

export {sagas};

export default reducer;
