import { combineReducers } from 'redux';
import { fork } from 'redux-saga/effects'

import departures, { sagas as departureSagas } from './departures';
import arrivals, { sagas as arrivalSagas } from './arrivals';

const reducer = combineReducers({
  departures,
  arrivals
});

export function* sagas() {
  yield [
    fork(departureSagas),
    fork(arrivalSagas),
  ]
}

export default reducer;
