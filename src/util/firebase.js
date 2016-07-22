import Config from 'Config';
import Firebase from 'firebase';

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
  const ref = new Firebase(Config.firebaseUrl + path);
  if (typeof callback === 'function') {
    callback(null, ref);
  } else {
    return ref;
  }
}

export function authenticate(token) {
  return () => new Promise((resolve, reject) => {
    const ref = new Firebase(Config.firebaseUrl);
    ref.authWithCustomToken(token, (error, authData) => {
      if (error) {
        reject(error);
      } else {
        resolve(authData);
      }
    }, {
      remember: 'sessionOnly',
    });
  });
}

export function unauth() {
  return () => new Promise((resolve) => {
    new Firebase(Config.firebaseUrl).unauth();
    resolve();
  });
}

export default firebase;
