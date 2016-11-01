import { takeEvery, takeLatest } from 'redux-saga';
import { call, fork } from 'redux-saga/effects'
import * as actions from './actions';
import createChannel, { monitor } from '../../../util/createChannel';
import * as sharedSagas from '../shared/sagas';
import * as remote from '../shared/remote';
import dates from '../../../core/dates.js';
import { localToFirebase, firebaseToLocal, transferValues } from '../../../util/movements';

export const departureSelector = (state, key) => state.movements.departures.data.keys[key];

export function* loadDepartures(channel) {
  yield call(
    sharedSagas.loadMovements,
    actions.setDeparturesLoading,
    state => state.movements.departures,
    '/departures',
    channel,
    actions.departuresAdded
  );
}

export function* deleteDeparture(action) {
  yield call(sharedSagas.deleteMovement, '/departures', action.payload.key, action.payload.successAction);
}

export function* initNewDeparture() {
  yield call(sharedSagas.initNewMovement, {
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'up'),
  });
}

export function* initNewDepartureFromArrival(action) {
  const snapshot = yield call(remote.loadByKey, '/arrivals', action.payload.arrivalKey);

  const initialValues = {
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'up'),
  };

  const val = snapshot.val();
  if (val) {
    const arrival = firebaseToLocal(snapshot.val());
    transferValues(arrival, initialValues, [
      'immatriculation',
      'aircraftType',
      'mtow',
      'memberNr',
      'lastname',
      'firstname',
      'phone',
      { name: 'passengerCount', defaultValue: 0 },
      'location',
      'flightType',
    ]);
  }

  yield call(sharedSagas.initNewMovement, initialValues);
}

export function* editDeparture(action) {
  yield call(sharedSagas.editMovement, '/departures', departureSelector, action.payload.key);
}

export function* saveDeparture() {
  yield call(sharedSagas.saveMovement, '/departures', actions.saveDepartureSuccess);
}

export default function* sagas() {
  const channel = createChannel();

  yield [
    fork(monitor, channel),
    fork(takeEvery, actions.LOAD_DEPARTURES, loadDepartures, channel),
    fork(takeEvery, actions.DELETE_DEPARTURE, deleteDeparture),
    fork(takeEvery, actions.INIT_NEW_DEPARTURE, initNewDeparture),
    fork(takeEvery, actions.INIT_NEW_DEPARTURE_FROM_ARRIVAL, initNewDepartureFromArrival),
    fork(takeEvery, actions.SAVE_DEPARTURE, saveDeparture),
    fork(takeLatest, actions.EDIT_DEPARTURE, editDeparture),
  ]
}
