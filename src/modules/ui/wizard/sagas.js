import { takeEvery } from 'redux-saga';
import { put, fork } from 'redux-saga/effects'
import { destroy } from 'redux-form';
import { push } from 'react-router-redux'
import {
  SAVE_DEPARTURE_SUCCESS,
  SAVE_DEPARTURE_FAILED,
} from '../../movements/departures';
import {
  SAVE_ARRIVAL_SUCCESS,
  SAVE_ARRIVAL_FAILED,
} from '../../movements/arrivals';
import {
  START_INITIALIZE_WIZARD,
  WIZARD_INITIALIZED,
} from '../../movements/shared';
import * as actions from './actions';

export function* init() {
  yield put(actions.reset());
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
    fork(takeEvery, SAVE_DEPARTURE_SUCCESS, setCommitted),
    fork(takeEvery, SAVE_ARRIVAL_SUCCESS, setCommitted),
    fork(takeEvery, actions.WIZARD_FINISH, finish),
    fork(takeEvery, SAVE_DEPARTURE_FAILED, setCommitError),
    fork(takeEvery, SAVE_ARRIVAL_FAILED, setCommitError),
  ]
}
