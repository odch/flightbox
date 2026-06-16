import firebase from '../../util/firebase';
import {
  get, child, query, orderByChild, startAt, limitToFirst,
  endAt as fbEndAt, onValue, remove, update, push
} from 'firebase/database';
import {toOrderKey} from './pagination'

const associationListeners = new Map<string, () => void>();

// High code point used as the inclusive upper bound of a createdBy prefix.
const PREFIX_END = '\uf8ff'

export function loadLimited(path: string, start: any, limit: number | null | undefined, endAt: any, createdBy?: string) {
  if (createdBy) {
    // Non-admin reads are bounded to the caller's own createdBy_orderKey prefix
    // so the query satisfies the read rules and cannot return other pilots'
    // rows. Both bounds are aligned to the orderKey format via toOrderKey.
    const startAtParam = typeof start === 'number' ? toOrderKey(createdBy, start) : `${createdBy}_`
    const endAtParam = endAt ? toOrderKey(createdBy, endAt) : `${createdBy}_${PREFIX_END}`
    const boundedQuery = query(
      firebase(path),
      orderByChild('createdBy_orderKey'),
      startAt(startAtParam),
      fbEndAt(endAtParam)
    );
    const limitedQuery = limit ? query(boundedQuery, limitToFirst(limit)) : boundedQuery;
    return get(limitedQuery).then(snapshot => ({snapshot, ref: limitedQuery}));
  }

  const baseQuery = query(
    firebase(path),
    orderByChild('negativeTimestamp'),
    startAt(start)
  );
  const limitedQuery = limit
    ? query(baseQuery, limitToFirst(limit))
    : query(baseQuery, fbEndAt(endAt));

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

export function removeAllAssociationListeners() {
  associationListeners.forEach(unsubscribe => unsubscribe());
  associationListeners.clear();
}
