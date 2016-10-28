import firebase from '../../../util/firebase';

export function loadLimited(path, start, limit) {
  return new Promise(resolve => {
    const ref = firebase(path)
      .orderByChild('negativeTimestamp')
      .limitToFirst(limit)
      .startAt(start);
    ref.once('value', snapshot => {
      resolve(snapshot);
    });
  });
}

export function loadByKey(path, key) {
  return new Promise(resolve => {
    firebase(path).child(key).once('value', snapshot => {
      resolve(snapshot);
    });
  });
}

export function removeMovement(path, key) {
  return new Promise(resolve => {
    firebase(path).child(key).remove(resolve);
  });
}

export function saveMovement(path, key, movement) {
  return new Promise((resolve, reject) => {
    const setCommitted = error => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    };

    if (key) {
      firebase(path).child(key).set(movement, setCommitted);
    } else {
      key = firebase(path).push(movement, setCommitted).key();
    }
  });
}
