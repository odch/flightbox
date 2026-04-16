import {
  authenticate,
  authenticateAsGuest,
  FIREBASE_AUTHENTICATION_EVENT,
  logout,
  sendAuthenticationEmail,
  verifyOtpCode,
  USERNAME_PASSWORD_AUTHENTICATION_FAILURE,
  registerPasskey,
  loginWithPasskey,
  loadPasskeys,
  removePasskey,
  Passkey,
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
  logout,
  registerPasskey,
  loginWithPasskey,
  loadPasskeys,
  removePasskey,
};

export type { Passkey };

export {sagas};

export default reducer;
