import firebase from '../../util/firebase';
import {
  get, child, query, orderByChild, startAt, limitToFirst,
  endAt as fbEndAt, onValue, remove, update, push
} from 'firebase/database';
import {toOrderKey} from './pagination'

const associationListeners = new Map();

export function loadLimited(path, start, limit, endAt, createdBy) {
  const startAtParam = createdBy ? `${createdBy}_${typeof start === 'number' ? start : ''}`: start
  const endAtParam = createdBy && endAt ? toOrderKey(createdBy, endAt) : createdBy ? createdBy : endAt

  const baseQuery = query(
    firebase(path),
    orderByChild(createdBy ? 'createdBy_orderKey' : 'negativeTimestamp'),
    startAt(startAtParam)
  );
  const limitedQuery = limit
    ? query(baseQuery, limitToFirst(limit))
    : query(baseQuery, fbEndAt(endAtParam));

  return get(limitedQuery).then(snapshot => ({snapshot, ref: limitedQuery}));
}

export function loadByKey(path, key) {
  return get(child(firebase(path), key));
}

export function removeMovement(path, key) {
  return remove(child(firebase(path), key));
}

export function saveMovement(path, key, movement) {
  return new Promise(async (resolve, reject) => {
    try {
      if (key) {
        await update(child(firebase(path), key), movement);
        resolve(key);
      } else {
        const newRef = await push(firebase(path), movement);
        resolve(newRef.key);
      }
    } catch (error) {
      reject(error);
    }
  });
}

export function addMovementAssociationListener(movementType, movementKey, callback) {
  const dbRef = child(
    child(firebase('/movementAssociations'), movementType === 'departure' ? 'departures' : 'arrivals'),
    movementKey
  );
  const unsubscribe = onValue(dbRef, callback);
  associationListeners.set(`${movementType}:${movementKey}`, unsubscribe);
}

export function removeMovementAssociationListener(movementType, movementKey) {
  const key = `${movementType}:${movementKey}`;
  associationListeners.get(key)?.();
  associationListeners.delete(key);
}
