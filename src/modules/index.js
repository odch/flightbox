import { combineReducers } from 'redux';
import { map } from 'ramda';
import { fork } from 'redux-saga/effects';

import auth, { sagas as authSagas } from './auth';
import showLogin from './showLogin';
import loginPage from './loginPage';

const reducer = combineReducers({
  auth,
  showLogin,
  loginPage,
});

const forkSagas = map(fork);

export const sagas = function* rootSaga () {
  yield forkSagas([
    authSagas
  ])
};

export default reducer;
