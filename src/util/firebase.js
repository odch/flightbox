import Firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

function initialize() {
  if (Firebase.apps.length > 0) {
    return;
  }

  const config = {
    apiKey: __FIREBASE_API_KEY__,
    databaseURL: `https://${__FIREBASE_DATABASE_NAME__ || __FIREBASE_PROJECT_ID__}.firebaseio.com`
  };

  Firebase.initializeApp(config);
}

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

  initialize();

  const ref = Firebase.database().ref(path);

  if (typeof callback === 'function') {
    callback(null, ref);
  } else {
    return ref;
  }
}

export function watchAuthState(callback) {
  initialize();
  Firebase.auth().onAuthStateChanged(callback);
}

export function authenticate(token) {
  return new Promise((resolve, reject) => {
    initialize();
    Firebase.auth().signInWithCustomToken(token)
      .then(user => {
        resolve(user);
      })
      .catch(error => {
        reject(error);
      });
  });
}

export function authenticateEmail(email, local) {
  return new Promise((resolve, reject) => {
    initialize();
    Firebase.auth().sendSignInLinkToEmail(email, {
      url: window.location.href,
      handleCodeInApp: true
    })
      .then(() => {
        window.localStorage.setItem('emailForSignIn', email);
        window.localStorage.setItem('isLocalSignIn', local);
        resolve();
      })
      .catch(error => {
        reject(error);
      });
  });
}

export function isSignInWithEmail() {
  return Firebase.auth().isSignInWithEmailLink(window.location.href)
}

export function signInWithEmail() {
  const email = window.localStorage.getItem('emailForSignIn');
  return Firebase.auth().signInWithEmailLink(email, window.location.href)
    .then(() => {
      window.localStorage.removeItem('emailForSignIn');
    })
}

export function unauth() {
  Firebase.auth().signOut();
}

export function loadValue(path) {
  return new Promise(resolve => {
    const ref = firebase(path);
    ref.orderByKey().once('value', snapshot => {
      resolve(snapshot);
    });
  });
}

export function getIdToken() {
  return Firebase.auth().currentUser.getIdToken()
}

export default firebase;

if (window.Cypress) {
  window.firebase = {
    authenticate: authenticate,
    unauth: unauth,
    getRef: firebase
  };
}
