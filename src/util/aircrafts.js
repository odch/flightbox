import firebase from './firebase';

function read(path) {
  return new Promise(resolve => {
    firebase(path, (error, ref) => {
      ref.once('value', snapshot => {
        const aircrafts = {};
        snapshot.forEach(record => {
          aircrafts[record.key()] = true;
        });
        resolve(aircrafts);
      });
    });
  });
}

export function fetch() {
  return new Promise(resolve => {
    const mfgtAircrafts = read('/settings/aircraftsMFGT');
    const lsztAircrafts = read('/settings/aircraftsLSZT');

    Promise.all([mfgtAircrafts, lsztAircrafts])
      .then(results => {
        const aircrafts = {
          mfgt: results[0],
          lszt: results[1],
        };
        resolve(aircrafts);
      });
  });
}
