import firebase from './firebase';

export function fetch() {
  return new Promise(resolve => {
    firebase('/aerodromes', (error, ref) => {
      ref.once('value', snapshot => {
        const aerodromes = {};
        snapshot.forEach(record => {
          aerodromes[record.key()] = record.val();
        });
        resolve(aerodromes);
      });
    });
  });
}
