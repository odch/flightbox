import {all, call, put, select, takeEvery} from 'redux-saga/effects'
import * as actions from './actions';
import firebase from '../../util/firebase';

export const aircraftsSelector = state => state.aircrafts;

export function loadAll() {
  return new Promise(resolve => {
    const ref = firebase('/aircrafts');
    ref.orderByKey().once('value', snapshot => {
      resolve(snapshot);
    });
  });
}

export function* loadAircrafts() {
  const aircrafts = yield select(aircraftsSelector);
  if (aircrafts.loading !== true) {
    yield put(actions.setAircraftsLoading());
    const snapshot = yield call(loadAll);
    yield put(actions.aircraftsLoaded(snapshot));
  }
}

export default function* sagas() {
  yield all([
    takeEvery(actions.LOAD_AIRCRAFTS, loadAircrafts),
  ])
}
