import { takeEvery, takeLatest } from 'redux-saga';
import { fork, call } from 'redux-saga/effects'
import * as actions from './actions';
import createChannel, { monitor } from '../../../util/createChannel';
import * as sharedSagas from '../shared/sagas';
import * as remote from '../shared/remote';
import dates from '../../../util/dates';
import { firebaseToLocal, transferValues } from '../../../util/movements';

export const arrivalSelector = (state, key) => state.movements.arrivals.data.getByKey(key);

export function* getDefaultValues() {
  return {
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'down'),
  };
}

export function* getDefaultValuesFromDeparture(departureKey) {
  const snapshot = yield call(remote.loadByKey, '/departures', departureKey);

  const initialValues = yield call(getDefaultValues);

  const val = snapshot.val();
  if (val) {
    const departure = firebaseToLocal(snapshot.val());
    transferValues(departure, initialValues, [
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

    if (departure.departureRoute === 'circuits') {
      initialValues.arrivalRoute = 'circuits';
    }
  }

  return initialValues;
}

function* loadArrivals(channel) {
  yield sharedSagas.loadMovements(
    actions.setArrivalsLoading,
    actions.loadArrivalsFailure,
    state => state.movements.arrivals,
    '/arrivals',
    channel,
    actions.arrivalsAdded,
    actions.arrivalAdded,
    actions.arrivalChanged,
    actions.arrivalDeleted
  );
}

export function* monitorArrivals(channel) {
  yield call(
    sharedSagas.monitorMovements,
    state => state.movements.arrivals,
    channel,
    actions.arrivalAdded,
    actions.arrivalChanged,
    actions.arrivalDeleted
  );
}

function* deleteArrival(action) {
  yield sharedSagas.deleteMovement('/arrivals', action.payload.key, action.payload.successAction);
}

export function* initNewArrival() {
  yield call(sharedSagas.initNewMovement, getDefaultValues);
}

export function* initNewArrivalFromDeparture(action) {
  yield call(sharedSagas.initNewMovement, getDefaultValuesFromDeparture, action.payload.departureKey);
}

export function* editArrival(action) {
  yield sharedSagas.editMovement('/arrivals', arrivalSelector, action.payload.key);
}

export function* saveArrival() {
  yield sharedSagas.saveMovement('/arrivals', actions.saveArrivalSuccess, actions.saveArrivalFailed);
}

export default function* sagas() {
  const channel = createChannel();

  yield [
    fork(monitor, channel),
    fork(takeEvery, actions.LOAD_ARRIVALS, loadArrivals, channel),
    fork(takeEvery, actions.MONITOR_ARRIVALS, monitorArrivals, channel),
    fork(takeEvery, actions.DELETE_ARRIVAL, deleteArrival),
    fork(takeEvery, actions.INIT_NEW_ARRIVAL, initNewArrival),
    fork(takeEvery, actions.INIT_NEW_ARRIVAL_FROM_DEPARTURE, initNewArrivalFromDeparture),
    fork(takeEvery, actions.SAVE_ARRIVAL, saveArrival),
    fork(takeLatest, actions.EDIT_ARRIVAL, editArrival),
  ]
}
