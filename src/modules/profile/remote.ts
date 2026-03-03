import firebase from '../../util/firebase';
import {get, update} from 'firebase/database';

export function load(username: string) {
  return get(firebase(`/profiles/${username}`));
}

export function save(username: string, profile: Record<string, unknown>) {
  return update(firebase(`/profiles/${username}`), profile);
}
