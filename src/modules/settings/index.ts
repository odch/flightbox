import {combineReducers} from 'redux';
import {all, fork} from 'redux-saga/effects'

import aerodromeStatus, {sagas as aerodromeStatusSagas} from './aerodromeStatus';
import aircrafts, {sagas as aircraftsSagas} from './aircrafts';
import lockDate, {sagas as lockDateSagas} from './lockDate';
import guestAccessToken, {sagas as guestAccessTokenSagas} from './guestAccessToken';
import kioskAccessToken, {sagas as kioskAccessTokenSagas} from './kioskAccessToken';
import invoiceRecipients, {sagas as invoiceRecipientsSagas} from './invoiceRecipients';
import privacyPolicyUrl, {sagas as privacyPolicyUrlSagas} from './privacyPolicyUrl';
import movementRetentionDays, {sagas as movementRetentionDaysSagas} from './movementRetentionDays';
import messageRetentionDays, {sagas as messageRetentionDaysSagas} from './messageRetentionDays';

const reducer = combineReducers({
  aerodromeStatus,
  aircrafts,
  lockDate,
  guestAccessToken,
  kioskAccessToken,
  invoiceRecipients,
  privacyPolicyUrl,
  movementRetentionDays,
  messageRetentionDays,
});

export function* sagas() {
  yield all([
    fork(aerodromeStatusSagas),
    fork(aircraftsSagas),
    fork(lockDateSagas),
    fork(guestAccessTokenSagas),
    fork(kioskAccessTokenSagas),
    fork(invoiceRecipientsSagas),
    fork(privacyPolicyUrlSagas),
    fork(movementRetentionDaysSagas),
    fork(messageRetentionDaysSagas),
  ])
}

export default reducer;
