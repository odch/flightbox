import firebase from './firebase';

function read(path) {
  return new Promise(resolve => {
    firebase(path, (error, ref) => {
      ref.once('value', snapshot => {
        const aircrafts = {};
        snapshot.forEach(record => {
          aircrafts[record.key] = true;
        });
        resolve(aircrafts);
      });
    });
  });
}

export function fetch() {
  return new Promise(resolve => {
    const clubAircrafts = read('/settings/aircrafts/club');
    const homeBaseAircrafts = read('/settings/aircrafts/homeBase');

    Promise.all([clubAircrafts, homeBaseAircrafts])
      .then(results => {
        const aircrafts = {
          club: results[0],
          homeBase: results[1],
        };
        resolve(aircrafts);
      });
  });
}

export const REGISTRATION_REGEX = /[^A-Z0-9]/g;
