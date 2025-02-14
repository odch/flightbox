import {combineReducers} from 'redux';
import {fork} from 'redux-saga/effects'

import aerodromeStatus, {sagas as aerodromeStatusSagas} from './aerodromeStatus';
import aircrafts, {sagas as aircraftsSagas} from './aircrafts';
import lockDate, {sagas as lockDateSagas} from './lockDate';
import guestAccessToken, {sagas as guestAccessTokenSagas} from './guestAccessToken';

const reducer = combineReducers({
  aerodromeStatus,
  aircrafts,
  lockDate,
  guestAccessToken,
});

export function* sagas() {
  yield [
    fork(aerodromeStatusSagas),
    fork(aircraftsSagas),
    fork(lockDateSagas),
    fork(guestAccessTokenSagas),
  ]
}

export default reducer;
