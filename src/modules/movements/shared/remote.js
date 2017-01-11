import firebase from '../../../util/firebase';

export function loadLimited(path, start, limit, childAdded, childChanged, childRemoved) {
  return new Promise(resolve => {
    const ref = firebase(path)
      .orderByChild('negativeTimestamp')
      .limitToFirst(limit)
      .startAt(start);
    let newItems = false;
    ref.once('value', snapshot => {
      newItems = true;
      resolve(snapshot);
    });
    ref.on('child_added', snapshot => {
      if (!newItems) return;
      childAdded(snapshot);
    });
    ref.on('child_changed', snapshot => {
      if (!newItems) return;
      childChanged(snapshot);
    });
    ref.on('child_removed', snapshot => {
      if (!newItems) return;
      childRemoved(snapshot);
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
