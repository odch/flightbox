import firebase from '../../../util/firebase';
import { getPagination } from './pagination';
import { put, call, select } from 'redux-saga/effects'

export function loadLimited(path, start, limit) {
  return () => new Promise(resolve => {
    const ref = firebase(path)
      .orderByChild('negativeTimestamp')
      .limitToFirst(limit)
      .startAt(start);
    ref.once('value', snapshot => {
      resolve(snapshot);
    });
  });
}

export function removeMovement(path, key) {
  return new Promise(resolve => {
    firebase(path).child(key).remove(resolve);
  });
}

export function* loadMovements(setLoadingAction, stateSelector, firebasePath, channel, successAction) {
  const movements = yield select(stateSelector);
  if (movements.loading !== true) {
    yield put(setLoadingAction());
    const pagination = getPagination(movements.data.array);
    const snapshot = yield call(loadLimited(firebasePath, pagination.start, pagination.limit));
    channel.put(successAction(snapshot));
  }
}

export function* deleteMovement(path, key, successAction) {
  yield call(removeMovement, path, key);
  yield put(successAction());
}
