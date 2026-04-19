import firebase from '../../util/firebase';
import {get, set, update} from 'firebase/database';
import type { Aircraft } from './migration';

export function load(username: string) {
  return get(firebase(`/profiles/${username}`));
}

export function save(username: string, profile: Record<string, unknown>) {
  return update(firebase(`/profiles/${username}`), profile);
}

export function saveAircraftsList(username: string, aircrafts: Aircraft[]) {
  return set(firebase(`/profiles/${username}/aircrafts`), aircrafts.length > 0 ? aircrafts : null);
}

export async function migrateAircrafts(username: string, aircrafts: Aircraft[]) {
  await set(firebase(`/profiles/${username}/aircrafts`), aircrafts);
  await update(firebase(`/profiles/${username}`), {
    immatriculation: null,
    aircraftType: null,
    mtow: null,
    aircraftCategory: null,
  });
}
