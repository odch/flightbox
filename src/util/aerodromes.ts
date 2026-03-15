import firebase from './firebase';
import {get as fbGet} from 'firebase/database';

export function fetch(): Promise<Record<string, any>> {
  return fbGet(firebase('/aerodromes'))
    .then(snapshot => {
      const aerodromes: Record<string, any> = {};
      snapshot.forEach(record => {
        aerodromes[record.key!] = record.val();
      });
      return aerodromes;
    });
}

export function get(key: string): Promise<any | null> {
  return fbGet(firebase('/aerodromes/' + key))
    .then(snapshot => {
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    });
}

export function exists(key: string): Promise<boolean> {
  return fbGet(firebase('/aerodromes/' + key))
    .then(snapshot => !snapshot.exists())
    .catch(() => true);
}
