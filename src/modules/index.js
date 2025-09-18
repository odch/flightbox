import {combineReducers} from 'redux';
import {map} from 'ramda';
import {fork} from 'redux-saga/effects';
import {reducer as formReducer} from 'redux-form';

import aerodromes, {sagas as aerodromesSagas} from './aerodromes';
import aircrafts, {sagas as aircraftsSagas} from './aircrafts';
import auth, {sagas as authSagas} from './auth';
import customs, {sagas as customsSagas} from './customs';
import imports, {sagas as importsSagas} from './imports';
import movements, {sagas as movementSagas} from './movements';
import settings, {sagas as settingsSagas} from './settings';
import messages, {sagas as messagesSagas} from './messages';
import reports, {sagas as reportsSagas} from './reports';
import ui, {sagas as uiSagas} from './ui';
import users, {sagas as usersSagas} from './users';
import profile, {sagas as profileSagas} from './profile';

const reducer = combineReducers({
  aerodromes,
  aircrafts,
  form: formReducer,
  auth,
  customs,
  imports,
  movements,
  settings,
  messages,
  reports,
  ui,
  users,
  profile
});

const forkSagas = map(fork);

export const sagas = function* rootSaga () {
  yield forkSagas([
    aerodromesSagas,
    aircraftsSagas,
    authSagas,
    importsSagas,
    movementSagas,
    settingsSagas,
    messagesSagas,
    reportsSagas,
    uiSagas,
    usersSagas,
    profileSagas,
    customsSagas
  ])
};

export default reducer;
