import { combineReducers } from 'redux';
import { fork } from 'redux-saga/effects'

import aerodromeStatus, { sagas as aerodromeStatusSagas } from './aerodromeStatus';
import aircrafts, { sagas as aircraftsSagas } from './aircrafts';
import lockDate, { sagas as lockDateSagas } from './lockDate';

const reducer = combineReducers({
  aerodromeStatus,
  aircrafts,
  lockDate,
});

export function* sagas() {
  yield [
    fork(aerodromeStatusSagas),
    fork(aircraftsSagas),
    fork(lockDateSagas),
  ]
}

export default reducer;
