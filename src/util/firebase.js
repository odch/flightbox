import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  query,
  orderByKey,
  get,
  push,
  remove,
} from 'firebase/database';

function initialize() {
  if (getApps().length > 0) {
    return;
  }

  const config = {
    apiKey: __FIREBASE_API_KEY__,
    databaseURL: __FIREBASE_DATABASE_URL__ || `https://${__FIREBASE_DATABASE_NAME__ || __FIREBASE_PROJECT_ID__}.firebaseio.com`
  };

  initializeApp(config);
}

function firebase(path) {
  initialize();
  return ref(getDatabase(), path || '/');
}

export function watchAuthState(callback) {
  initialize();
  onAuthStateChanged(getAuth(), callback);
}

export function authenticate(token) {
  initialize();
  return signInWithCustomToken(getAuth(), token);
}

export function authenticateEmail(email, local) {
  return new Promise((resolve, reject) => {
    initialize();

    const functionUrl = `https://us-central1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/generateSignInLink`;

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        continueUrl: window.location.href
      })
    };

    fetch(functionUrl, requestOptions)
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.error || 'Failed to generate sign-in link');
          });
        }
        return response.json();
      })
      .then(data => {
        window.localStorage.setItem('emailForSignIn', email);
        window.localStorage.setItem('isLocalSignIn', local);

        resolve({
          signInLink: data.signInLink,
          email: data.email
        });
      })
      .catch(reject);
  });
}

export function isSignInWithEmail() {
  initialize();
  return isSignInWithEmailLink(getAuth(), window.location.href);
}

export function signInWithEmail() {
  const email = window.localStorage.getItem('emailForSignIn');
  initialize();
  return signInWithEmailLink(getAuth(), email, window.location.href)
    .then(() => {
      window.localStorage.removeItem('emailForSignIn');
    });
}

export function unauth() {
  initialize();
  signOut(getAuth());
}

export function loadValue(path) {
  return get(query(firebase(path), orderByKey()));
}

export function getIdToken() {
  initialize();
  return getAuth().currentUser.getIdToken();
}

export default firebase;

if (window.Cypress) {
  window.firebase = {
    authenticate,
    unauth,
    getRef: (path) => {
      initialize();
      const dbRef = ref(getDatabase(), path || '/');
      return {
        once: () => get(dbRef),
        remove: () => remove(dbRef),
        push: (data) => push(dbRef, data),
      };
    }
  };
}
