import Config from 'Config';
import Firebase from 'firebase';
import auth from './auth.js';

/**
 * Get a firebase ref.
 *
 * @param path The path of the firebase resource (without domain part) (if not given, '/' is used).
 * @param token The authentication token to use (if not given, auth#getBestToken() is used).
 * @param callback The function to call after authentication (arguments: error, ref, authData).
 */
function firebase(path, token, callback) {
  if (!token || typeof token === 'function') {
    callback = token;
    token = auth.getBestToken();
  }

  if (!path || typeof path === 'function') {
    callback = path;
    path = '/';
  }

  const ref = new Firebase(Config.firebaseUrl + path);
  ref.authWithCustomToken(token, (error, authData) => {
    if (error) {
      callback(error);
    } else {
      callback(null, ref, authData);
    }
  });
}

export default firebase;
