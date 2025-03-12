import {combineReducers} from 'redux';
import {fork} from 'redux-saga/effects'

import aerodromeStatus, {sagas as aerodromeStatusSagas} from './aerodromeStatus';
import aircrafts, {sagas as aircraftsSagas} from './aircrafts';
import lockDate, {sagas as lockDateSagas} from './lockDate';
import guestAccessToken, {sagas as guestAccessTokenSagas} from './guestAccessToken';
import invoiceRecipients, {sagas as invoiceRecipientsSagas} from './invoiceRecipients';

const reducer = combineReducers({
  aerodromeStatus,
  aircrafts,
  lockDate,
  guestAccessToken,
  invoiceRecipients,
});

export function* sagas() {
  yield [
    fork(aerodromeStatusSagas),
    fork(aircraftsSagas),
    fork(lockDateSagas),
    fork(guestAccessTokenSagas),
    fork(invoiceRecipientsSagas),
  ]
}

export default reducer;
