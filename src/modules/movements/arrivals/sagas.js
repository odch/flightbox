import { takeEvery, takeLatest } from 'redux-saga';
import { fork } from 'redux-saga/effects'
import * as actions from './actions';
import createChannel, { monitor } from '../../../util/createChannel';
import * as sharedSagas from '../shared/sagas';
import dates from '../../../core/dates.js';

export const arrivalSelector = (state, key) => state.movements.arrivals.data.keys[key];

function* loadArrivals(channel) {
  yield sharedSagas.loadMovements(
    actions.setArrivalsLoading,
    state => state.movements.arrivals,
    '/arrivals',
    channel,
    actions.arrivalsAdded
  );
}

function* deleteArrival(action) {
  yield sharedSagas.deleteMovement('/arrivals', action.payload.key, action.payload.successAction);
}

export function* initNewArrival() {
  yield sharedSagas.initNewMovement({
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'down'),
  });
}

export function* editArrival(action) {
  yield sharedSagas.editMovement('/arrivals', arrivalSelector, action.payload.key);
}

export function* saveArrival() {
  yield sharedSagas.saveMovement('/arrivals', actions.saveArrivalSuccess);
}

export default function* sagas() {
  const channel = createChannel();

  yield [
    fork(monitor, channel),
    fork(takeEvery, actions.LOAD_ARRIVALS, loadArrivals, channel),
    fork(takeEvery, actions.DELETE_ARRIVAL, deleteArrival),
    fork(takeEvery, actions.INIT_NEW_ARRIVAL, initNewArrival),
    fork(takeEvery, actions.SAVE_ARRIVAL, saveArrival),
    fork(takeLatest, actions.EDIT_ARRIVAL, editArrival),
  ]
}
