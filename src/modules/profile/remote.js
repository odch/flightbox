import firebase from '../../util/firebase';
import {get, update} from 'firebase/database';

export function load(username) {
  return get(firebase(`/profiles/${username}`));
}

export function save(username, profile) {
  return update(firebase(`/profiles/${username}`), profile);
}
