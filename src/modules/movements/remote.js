import firebase from '../../util/firebase';

export function loadLimited(path, start, limit, endAt) {
  return new Promise(resolve => {
    const ref = firebase(path)
      .orderByChild('negativeTimestamp')
      .startAt(start);
    const limitedRef = limit
      ? ref.limitToFirst(limit)
      : ref.endAt(endAt);
    limitedRef.once('value', snapshot => {
      resolve({
        snapshot,
        ref: limitedRef
      });
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
      firebase(path).child(key).update(movement, setCommitted);
    } else {
      key = firebase(path).push(movement, setCommitted).key;
    }
  });
}
