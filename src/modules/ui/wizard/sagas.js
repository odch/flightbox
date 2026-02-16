import {all, put, takeEvery} from 'redux-saga/effects'
import {
  SAVE_MOVEMENT_FAILED,
  SAVE_MOVEMENT_SUCCESS,
  START_INITIALIZE_WIZARD,
  WIZARD_INITIALIZED
} from '../../movements';
import * as actions from './actions';
import {reset as arrivalPaymentReset} from '../arrivalPayment'
import {history} from '../../../history'

export function* init() {
  yield put(actions.reset());
  yield put(arrivalPaymentReset());
}

export function* setInitialized() {
  yield put(actions.setInitialized());
}

export function* setCommitted(action) {
  yield put(actions.setCommitted(action.payload.key, action.payload.values));
}

export function* setCommitError(action) {
  yield put(actions.setCommitError(action.payload.error));
}

export function* finish() {
  history.push('/');
  yield put(actions.reset());
}

export default function* sagas() {
  yield all([
    takeEvery(START_INITIALIZE_WIZARD, init),
    takeEvery(WIZARD_INITIALIZED, setInitialized),
    takeEvery(SAVE_MOVEMENT_SUCCESS, setCommitted),
    takeEvery(actions.WIZARD_FINISH, finish),
    takeEvery(SAVE_MOVEMENT_FAILED, setCommitError)
  ])
}
