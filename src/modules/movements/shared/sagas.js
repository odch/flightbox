import { getPagination } from './pagination';
import { put, call, select } from 'redux-saga/effects'
import { loadLimited, removeMovement } from './remote';

export function* loadMovements(setLoadingAction, stateSelector, firebasePath, channel, successAction) {
  const movements = yield select(stateSelector);
  if (movements.loading !== true) {
    yield put(setLoadingAction());
    const pagination = getPagination(movements.data.array);
    const snapshot = yield call(loadLimited, firebasePath, pagination.start, pagination.limit);
    channel.put(successAction(snapshot));
  }
}

export function* deleteMovement(path, key, successAction) {
  yield call(removeMovement, path, key);
  yield put(successAction());
}
