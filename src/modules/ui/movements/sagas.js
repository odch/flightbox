import { takeEvery } from 'redux-saga';
import { put, fork } from 'redux-saga/effects'
import { push } from 'react-router-redux'
import * as actions from './actions';

export function* createDepartureFromArrival(action) {
  yield put(push('/departure/new/' + action.payload.arrivalKey));
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.CREATE_DEPARTURE_FROM_ARRIVAL, createDepartureFromArrival),
  ]
}
