import {combineReducers} from 'redux';
import {all, fork} from 'redux-saga/effects'
import loginPage from './loginPage';
import movements, {sagas as movementsSagas} from './movements';
import settings from './settings';
import showLogin from './showLogin';
import wizard, {sagas as wizardSagas} from './wizard';
import arrivalPayment, {sagas as arrivalPaymentSagas} from './arrivalPayment';

const reducer = combineReducers({
  loginPage,
  movements,
  settings,
  showLogin,
  wizard,
  arrivalPayment,
});

export function* sagas() {
  yield all([
    fork(movementsSagas),
    fork(wizardSagas),
    fork(arrivalPaymentSagas),
  ])
}

export default reducer;
