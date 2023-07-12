import { takeEvery } from 'redux-saga';
import { put, fork } from 'redux-saga/effects'
import { push } from 'react-router-redux'
import {
  SAVE_MOVEMENT_SUCCESS,
  SAVE_MOVEMENT_FAILED,
  START_INITIALIZE_WIZARD,
  WIZARD_INITIALIZED
} from '../../movements';
import * as actions from './actions';
import {reset as arrivalPaymentReset} from '../arrivalPayment'

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
  yield put(push('/'));
  yield put(actions.reset());
}

export default function* sagas() {
  yield [
    fork(takeEvery, START_INITIALIZE_WIZARD, init),
    fork(takeEvery, WIZARD_INITIALIZED, setInitialized),
    fork(takeEvery, SAVE_MOVEMENT_SUCCESS, setCommitted),
    fork(takeEvery, actions.WIZARD_FINISH, finish),
    fork(takeEvery, SAVE_MOVEMENT_FAILED, setCommitError)
  ]
}
