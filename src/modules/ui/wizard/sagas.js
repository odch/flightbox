import { takeEvery } from 'redux-saga';
import { put, fork } from 'redux-saga/effects'
import { destroy } from 'redux-form';
import { push } from 'react-router-redux'
import { INIT_NEW_DEPARTURE, EDIT_DEPARTURE, SAVE_DEPARTURE_SUCCESS } from '../../movements/departures';
import { INIT_NEW_ARRIVAL, EDIT_ARRIVAL, SAVE_ARRIVAL_SUCCESS } from '../../movements/arrivals';
import * as actions from './actions';

export function* init() {
  yield put(actions.reset());
}

export function* setCommitted() {
  yield put(actions.setCommitted());
}

export function* finish() {
  yield put(push('/'));
  yield put(actions.reset());
}

export default function* sagas() {
  yield [
    fork(takeEvery, INIT_NEW_DEPARTURE, init),
    fork(takeEvery, INIT_NEW_ARRIVAL, init),
    fork(takeEvery, EDIT_DEPARTURE, init),
    fork(takeEvery, EDIT_ARRIVAL, init),
    fork(takeEvery, SAVE_DEPARTURE_SUCCESS, setCommitted),
    fork(takeEvery, SAVE_ARRIVAL_SUCCESS, setCommitted),
    fork(takeEvery, actions.WIZARD_FINISH, finish),
  ]
}
