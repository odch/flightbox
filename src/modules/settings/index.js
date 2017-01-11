import { combineReducers } from 'redux';
import { fork } from 'redux-saga/effects'

import aircrafts, { sagas as aircraftsSagas } from './aircrafts';
import lockDate, { sagas as lockDateSagas } from './lockDate';

const reducer = combineReducers({
  aircrafts,
  lockDate,
});

export function* sagas() {
  yield [
    fork(aircraftsSagas),
    fork(lockDateSagas),
  ]
}

export default reducer;
