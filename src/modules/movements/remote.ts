import firebase from '../../util/firebase';
import {
  get, child, query, orderByChild, startAt, limitToFirst,
  endAt as fbEndAt, onValue, remove, update, push
} from 'firebase/database';
import {toOrderKey} from './pagination'

const associationListeners = new Map<string, () => void>();

export function loadLimited(path: string, start: any, limit: number | null | undefined, endAt: any, createdBy?: string) {
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

export function loadByKey(path: string, key: string) {
  return get(child(firebase(path), key));
}

export function removeMovement(path: string, key: string) {
  return remove(child(firebase(path), key));
}

export function saveMovement(path: string, key: string | null | undefined, movement: Record<string, unknown>): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if (key) {
        await update(child(firebase(path), key), movement);
        resolve(key);
      } else {
        const newRef = await push(firebase(path), movement);
        resolve(newRef.key as string);
      }
    } catch (error) {
      reject(error);
    }
  });
}

export function addMovementAssociationListener(movementType: string, movementKey: string, callback: (snapshot: any) => void) {
  const dbRef = child(
    child(firebase('/movementAssociations'), movementType === 'departure' ? 'departures' : 'arrivals'),
    movementKey
  );
  const unsubscribe = onValue(dbRef, callback);
  associationListeners.set(`${movementType}:${movementKey}`, unsubscribe);
}

export function removeMovementAssociationListener(movementType: string, movementKey: string) {
  const key = `${movementType}:${movementKey}`;
  associationListeners.get(key)?.();
  associationListeners.delete(key);
}
