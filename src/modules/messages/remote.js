import firebase from '../../util/firebase';
import {get, query, orderByKey, push} from 'firebase/database';

export function loadAll() {
  return get(query(firebase('/messages'), orderByKey()));
}

export function save(message) {
  const timestamp = new Date().getTime();
  const withDate = Object.assign({}, message, {
    timestamp,
    negativeTimestamp: timestamp * -1,
  });
  return push(firebase('/messages'), withDate).then(() => undefined);
}
