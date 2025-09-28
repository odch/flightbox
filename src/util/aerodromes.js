import firebase from './firebase';

export function fetch() {
  return new Promise(resolve => {
    firebase('/aerodromes', (error, ref) => {
      ref.once('value', snapshot => {
        const aerodromes = {};
        snapshot.forEach(record => {
          aerodromes[record.key] = record.val();
        });
        resolve(aerodromes);
      });
    });
  });
}

export function get(key) {
  return new Promise(resolve => {
    firebase('/aerodromes/' + key, (error, ref) => {
      ref.once('value', snapshot => {
        if (snapshot.exists()) {
          resolve(snapshot.val());
        } else {
          resolve(null);
        }
      });
    });
  });
}

export function exists(key) {
  return new Promise(resolve => {
    firebase('/aerodromes/' + key, (error, ref) => {
      ref.once('value', snapshot => {
        resolve(!snapshot.exists());
      }, () => {
        resolve(true);
      });
    });
  });
}
