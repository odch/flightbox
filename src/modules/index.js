import {combineReducers} from 'redux';
import {connectRouter} from 'connected-react-router';
import {map} from 'ramda';
import {all, fork} from 'redux-saga/effects';
import {reducer as formReducer} from 'redux-form';

import aerodromes, {sagas as aerodromesSagas} from './aerodromes';
import aircrafts, {sagas as aircraftsSagas} from './aircrafts';
import auth, {sagas as authSagas} from './auth';
import customs, {sagas as customsSagas} from './customs';
import imports, {sagas as importsSagas} from './imports';
import invoiceRecipients, {sagas as invoiceRecipientsSagas} from './invoiceRecipients';
import movements, {sagas as movementSagas} from './movements';
import settings, {sagas as settingsSagas} from './settings';
import messages, {sagas as messagesSagas} from './messages';
import reports, {sagas as reportsSagas} from './reports';
import ui, {sagas as uiSagas} from './ui';
import users, {sagas as usersSagas} from './users';
import profile, {sagas as profileSagas} from './profile';

const createRootReducer = (history) => combineReducers({
  router: connectRouter(history),
  aerodromes,
  aircrafts,
  form: formReducer,
  auth,
  customs,
  imports,
  invoiceRecipients,
  movements,
  settings,
  messages,
  reports,
  ui,
  users,
  profile
});

const forkSagas = map(fork);

export const sagas = function* rootSaga() {
  yield all(forkSagas([
    aerodromesSagas,
    aircraftsSagas,
    authSagas,
    importsSagas,
    invoiceRecipientsSagas,
    movementSagas,
    settingsSagas,
    messagesSagas,
    reportsSagas,
    uiSagas,
    usersSagas,
    profileSagas,
    customsSagas
  ]))
};

export default createRootReducer;
