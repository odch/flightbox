import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
  setPersistence,
  browserSessionPersistence,
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

export function authenticate(token, shared = false) {
  initialize();
  const auth = getAuth();
  if (!shared) {
    // Individual users: keep Firebase's default (local) persistence, unchanged.
    return signInWithCustomToken(auth, token);
  }
  // Shared devices (kiosk / guest): use session persistence so the login does
  // not outlive the browser session. Fall back to the default if the browser
  // does not support it, rather than blocking sign-in.
  return setPersistence(auth, browserSessionPersistence)
    .catch(() => undefined)
    .then(() => signInWithCustomToken(auth, token));
}

export function requestSignInCode(email: string, airportName: string, themeColor: string, language: string) {
  initialize();

  const functionUrl = `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/generateSignInCode`;

  return fetch(functionUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, airportName, themeColor, language }),
  })
    .then(response => {
      if (!response.ok) {
        return response.json().catch(() => ({})).then((errorData: any) => {
          const error: any = new Error(errorData.error || 'Failed to send sign-in code');
          error.status = response.status;
          error.retryAfterSeconds = errorData.retryAfterSeconds;
          throw error;
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
  // Return the promise so callers can await completion before navigating away;
  // otherwise the redirect can race sign-out and leave the session in place.
  return signOut(getAuth());
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
