import { takeEvery } from 'redux-saga';
import { put, fork } from 'redux-saga/effects'
import { push } from 'react-router-redux'
import * as actions from './actions';

export function* showDepartureWizard(action) {
  yield put(push('/departure/' + action.payload.departureKey));
}

export function* showArrivalWizard(action) {
  yield put(push('/arrival/' + action.payload.arrivalKey));
}

export function* createDepartureFromArrival(action) {
  yield put(push('/departure/new/' + action.payload.arrivalKey));
}

export function* createArrivalFromDeparture(action) {
  yield put(push('/arrival/new/' + action.payload.departureKey));
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.SHOW_DEPARTURE_WIZARD, showDepartureWizard),
    fork(takeEvery, actions.SHOW_ARRIVAL_WIZARD, showArrivalWizard),
    fork(takeEvery, actions.CREATE_DEPARTURE_FROM_ARRIVAL, createDepartureFromArrival),
    fork(takeEvery, actions.CREATE_ARRIVAL_FROM_DEPARTURE, createArrivalFromDeparture),
  ]
}
