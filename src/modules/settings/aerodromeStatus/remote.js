import firebase from '../../../util/firebase';

export function loadLatest() {
  return new Promise(resolve => {
    const ref = firebase('/status');
    ref.orderByChild('timestamp').limitToLast(10).once('value', snapshot => {
      resolve(snapshot);
    });
  });
}

export function save(status) {
  return new Promise((resolve, reject) => {
    firebase('/status/', (error, ref) => {
      ref.push(status, commitError => {
        if (commitError) {
          reject(commitError);
        } else {
          resolve();
        }
      });
    });
  });
}
