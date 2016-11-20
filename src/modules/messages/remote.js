import firebase from '../../util/firebase';

export function loadAll() {
  return new Promise(resolve => {
    const ref = firebase('/messages');
    ref.orderByKey().once('value', snapshot => {
      resolve(snapshot);
    });
  });
}

export function save(message) {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().getTime();
    const withDate = Object.assign({}, message, {
      timestamp,
      negativeTimestamp: timestamp * -1,
    });
    firebase('/messages/', (error, ref) => {
      ref.push(withDate, commitError => {
        if (commitError) {
          reject(commitError);
        } else {
          resolve();
        }
      });
    });
  });
}
