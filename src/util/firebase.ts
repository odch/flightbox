import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
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

export function requestSignInCode(email: string, airportName: string, themeColor: string) {
  initialize();

  const functionUrl = `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/generateSignInCode`;

  return fetch(functionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, airportName, themeColor }),
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.error || 'Failed to send sign-in code');
        });
      }
    });
}

export function verifyOtpCode(email: string, code: string) {
  initialize();

  const functionUrl = `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/verifySignInCode`;

  return fetch(functionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(errorData => {
          throw new Error(errorData.error || 'Invalid or expired code');
        });
      }
      return response.json();
    })
    .then(data => data.token);
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
  return getAuth().currentUser!.getIdToken();
}

export default firebase;

if ((window as any).Cypress) {
  (window as any).firebase = {
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
