import { takeEvery } from 'redux-saga';
import { put, fork } from 'redux-saga/effects'
import { reset as resetForm } from 'redux-form';
import { push } from 'react-router-redux'
import { SAVE_DEPARTURE_SUCCESS } from '../../departures';
import * as actions from './actions';

export function* setCommitted() {
  yield put(actions.setCommitted());
}

export function* finish() {
  yield put(push('/'));
  yield put(actions.reset());
  yield put(resetForm('wizard'));
}

export default function* sagas() {
  yield [
    fork(takeEvery, SAVE_DEPARTURE_SUCCESS, setCommitted),
    fork(takeEvery, actions.WIZARD_FINISH, finish),
  ]
}
