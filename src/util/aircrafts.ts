import firebase from './firebase';
import {get} from 'firebase/database';

function read(path: string): Promise<Record<string, true>> {
  return get(firebase(path))
    .then(snapshot => {
      const aircrafts: Record<string, true> = {};
      snapshot.forEach(record => {
        aircrafts[record.key!] = true;
      });
      return aircrafts;
    });
}

export function fetch(): Promise<{ club: Record<string, true>; homeBase: Record<string, true> }> {
  const clubAircrafts = read('/settings/aircrafts/club');
  const homeBaseAircrafts = read('/settings/aircrafts/homeBase');

  return Promise.all([clubAircrafts, homeBaseAircrafts])
    .then(results => ({
      club: results[0],
      homeBase: results[1],
    }));
}

export const REGISTRATION_REGEX = /[^A-Z0-9]/g;
