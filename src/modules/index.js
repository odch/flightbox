import { combineReducers } from 'redux';
import { map } from 'ramda';
import { fork } from 'redux-saga/effects';

import auth, { sagas as authSagas } from './auth';
import showLogin from './showLogin';
import loginPage from './loginPage';
import movements, { sagas as movementSagas } from './movements';
import settings, { sagas as settingsSagas } from './settings';
import messages, { sagas as messagesSagas } from './messages';

const reducer = combineReducers({
  auth,
  showLogin,
  loginPage,
  movements,
  settings,
  messages,
});

const forkSagas = map(fork);

export const sagas = function* rootSaga () {
  yield forkSagas([
    authSagas,
    movementSagas,
    settingsSagas,
    messagesSagas,
  ])
};

export default reducer;
