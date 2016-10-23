import { combineReducers } from 'redux';
import { fork } from 'redux-saga/effects'
import loginPage from './loginPage';
import movements from './movements';
import showLogin from './showLogin';
import wizard, { sagas as wizardSagas } from './wizard';

const reducer = combineReducers({
  loginPage,
  movements,
  showLogin,
  wizard,
});

export function* sagas() {
  yield [
    fork(wizardSagas),
  ]
}

export default reducer;
