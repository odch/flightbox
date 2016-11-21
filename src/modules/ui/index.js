import { combineReducers } from 'redux';
import { fork } from 'redux-saga/effects'
import loginPage from './loginPage';
import movements, { sagas as movementsSagas } from './movements';
import settings from './settings';
import showLogin from './showLogin';
import wizard, { sagas as wizardSagas } from './wizard';

const reducer = combineReducers({
  loginPage,
  movements,
  settings,
  showLogin,
  wizard,
});

export function* sagas() {
  yield [
    fork(movementsSagas),
    fork(wizardSagas),
  ]
}

export default reducer;
