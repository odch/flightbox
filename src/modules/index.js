import { combineReducers } from 'redux';
import { map } from 'ramda';
import { fork } from 'redux-saga/effects';
import { reducer as formReducer } from 'redux-form';

import aircrafts, { sagas as aircraftsSagas } from './aircrafts';
import auth, { sagas as authSagas } from './auth';
import showLogin from './showLogin';
import loginPage from './loginPage';
import movements, { sagas as movementSagas } from './movements';
import settings, { sagas as settingsSagas } from './settings';
import messages, { sagas as messagesSagas } from './messages';
import ui, { sagas as uiSagas } from './ui';
import { sagas as departureSagas } from './departures';
import users, { sagas as usersSagas } from './users';

const reducer = combineReducers({
  aircrafts,
  form: formReducer,
  auth,
  showLogin,
  loginPage,
  movements,
  settings,
  messages,
  ui,
  users
});

const forkSagas = map(fork);

export const sagas = function* rootSaga () {
  yield forkSagas([
    aircraftsSagas,
    authSagas,
    movementSagas,
    settingsSagas,
    messagesSagas,
    uiSagas,
    departureSagas,
    usersSagas,
  ])
};

export default reducer;
