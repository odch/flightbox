import {combineReducers} from 'redux';
import {map} from 'ramda';
import {all, fork} from 'redux-saga/effects';

import aerodromes, {sagas as aerodromesSagas} from './aerodromes';
import aircrafts, {sagas as aircraftsSagas} from './aircrafts';
import auth, {sagas as authSagas} from './auth';
import customs, {sagas as customsSagas} from './customs';
import invoiceRecipients, {sagas as invoiceRecipientsSagas} from './invoiceRecipients';
import movements, {sagas as movementSagas} from './movements';
import settings, {sagas as settingsSagas} from './settings';
import messages, {sagas as messagesSagas} from './messages';
import reports, {sagas as reportsSagas} from './reports';
import ui, {sagas as uiSagas} from './ui';
import users, {sagas as usersSagas} from './users';
import profile, {sagas as profileSagas} from './profile';
import frequentAerodromes, {sagas as frequentAerodromesSagas} from './frequentAerodromes';

const createRootReducer = () => combineReducers({
  aerodromes,
  aircrafts,
  auth,
  customs,
  invoiceRecipients,
  movements,
  settings,
  messages,
  reports,
  ui,
  users,
  profile,
  frequentAerodromes
});

export type RootState = ReturnType<ReturnType<typeof createRootReducer>>;
export type AppDispatch = import('redux').Dispatch;

const forkSagas = map(fork);

export const sagas = function* rootSaga() {
  yield all(forkSagas([
    aerodromesSagas,
    aircraftsSagas,
    authSagas,
    invoiceRecipientsSagas,
    movementSagas,
    settingsSagas,
    messagesSagas,
    reportsSagas,
    uiSagas,
    usersSagas,
    profileSagas,
    frequentAerodromesSagas,
    customsSagas
  ]))
};

export default createRootReducer;
