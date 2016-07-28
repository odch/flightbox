import Firebase from 'firebase';
import auth from './auth.js';

/**
 * Get a firebase ref.
 *
 * @param path The path of the firebase resource (without domain part) (if not given, '/' is used).
 * @param callback The function to call after authentication (arguments: error, ref, authData).
 */
function firebase(path, callback) {
  if (!path || typeof path === 'function') {
    callback = path;
    path = '/';
  }
  const ref = new Firebase(__FIREBASE_URL__ + path);
  callback(null, ref);
}

export function authenticate(token, callback) {
  const ref = new Firebase(__FIREBASE_URL__);
  ref.authWithCustomToken(token, (error, authData) => {
    if (error) {
      callback(error);
    } else {
      callback(null, authData);
    }
  });
}

export function unauth() {
  new Firebase(__FIREBASE_URL__).unauth();
}

export default firebase;
