import firebase from '../../../util/firebase';
import {get, query, orderByChild, limitToLast, push} from 'firebase/database';

export function loadLatest() {
  return get(query(firebase('/status'), orderByChild('timestamp'), limitToLast(10)));
}

export function save(status) {
  return push(firebase('/status'), status).then(() => undefined);
}
