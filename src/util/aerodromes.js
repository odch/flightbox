import firebase from './firebase';
import {get as fbGet} from 'firebase/database';

export function fetch() {
  return fbGet(firebase('/aerodromes'))
    .then(snapshot => {
      const aerodromes = {};
      snapshot.forEach(record => {
        aerodromes[record.key] = record.val();
      });
      return aerodromes;
    });
}

export function get(key) {
  return fbGet(firebase('/aerodromes/' + key))
    .then(snapshot => {
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    });
}

export function exists(key) {
  return fbGet(firebase('/aerodromes/' + key))
    .then(snapshot => !snapshot.exists())
    .catch(() => true);
}
