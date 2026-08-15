import firebase from '../../../util/firebase';
import {get, query, orderByChild, limitToLast, push} from 'firebase/database';

export function loadLatest() {
  return get(query(firebase('/status'), orderByChild('timestamp'), limitToLast(10)));
}

export function save(status: unknown) {
  return push(firebase('/status'), status as any).then(() => undefined);
}

// Public, unauthenticated status endpoint (Cloud Function over the Admin SDK).
// Used instead of a direct RTDB read so the raw /status node can be locked down
// and the read path stays behind a backend-agnostic HTTP contract.
export function fetchCurrentStatus() {
  const url = `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/api/aerodrome/status`;
  return fetch(url).then(response => response.json());
}
