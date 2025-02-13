import firebase from '../../util/firebase';
import {toOrderKey} from './pagination'

export function loadLimited(path, start, limit, endAt, createdBy) {
  return new Promise(resolve => {
    const startAtParam = createdBy ? `${createdBy}_${typeof start === 'number' ? start : ''}`: start
    const endAtParam = createdBy && endAt ? toOrderKey(createdBy, endAt) : createdBy ? createdBy : endAt

    const ref = firebase(path)
      .orderByChild(createdBy ? 'createdBy_orderKey' : 'negativeTimestamp')
      .startAt(startAtParam);
    const limitedRef = limit
      ? ref.limitToFirst(limit)
      : ref.endAt(endAtParam);
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

export function addMovementAssociationListener(movementType, movementKey, callback) {
  const ref = firebase('/movementAssociations')
    .child(movementType === 'departure' ? 'departures' : 'arrivals')
    .child(movementKey)
  ref.on('value', callback);
}

export function removeMovementAssociationListener(movementType, movementKey) {
  const ref = firebase('/movementAssociations')
    .child(movementType === 'departure' ? 'departures' : 'arrivals')
    .child(movementKey)
  ref.off('value');
}
