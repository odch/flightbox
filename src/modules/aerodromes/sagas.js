import {all, call, put, select, takeLatest} from 'redux-saga/effects'
import * as actions from './actions';
import {loadValue} from '../../util/firebase';

export const aerodromesSelector = state => state.aerodromes;

export function* loadAerodromes() {
  const aerodromes = yield select(aerodromesSelector);
  if (aerodromes.loading !== true) {
    yield put(actions.setAerodromesLoading());
    const snapshot = yield call(loadValue, '/aerodromes');
    yield put(actions.aerodromesLoaded(snapshot));
  }
}

export default function* sagas() {
  yield all([
    takeLatest(actions.LOAD_AERODROMES, loadAerodromes),
  ])
}
