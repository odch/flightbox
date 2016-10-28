import { takeEvery, takeLatest } from 'redux-saga';
import { call, put, fork, select } from 'redux-saga/effects'
import { initialize, getFormValues, destroy } from 'redux-form'
import * as actions from './actions';
import createChannel, { monitor } from '../../../util/createChannel';
import * as sharedSagas from '../shared/sagas';
import * as remote from '../shared/remote';
import dates from '../../../core/dates.js';
import { localToFirebase, firebaseToLocal } from '../../../util/movements';

export const departureSelector = key => state => state.movements.departures.data.keys[key];

function* loadDepartures(channel) {
  yield sharedSagas.loadMovements(
    actions.setDeparturesLoading,
    state => state.movements.departures,
    '/departures',
    channel,
    actions.departuresAdded
  );
}

function* deleteDeparture(action) {
  yield sharedSagas.deleteMovement('/departures', action.payload.key, action.payload.successAction);
}

export function* initNewDeparture() {
  yield put(destroy('wizard'));
  yield put(initialize('wizard', {
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'up'),
  }));
}

export function* editDeparture(action) {
  yield put(destroy('wizard'));
  let departure = yield(select(departureSelector(action.payload.key)));
  if (!departure) {
    const snapshot = yield(call(remote.loadByKey, '/departures', action.payload.key));
    departure = firebaseToLocal(snapshot.val());
    departure.key = snapshot.key();
  }
  yield put(initialize('wizard', departure));
}

export function* saveDeparture() {
  const values = yield select(getFormValues('wizard'));
  const movement = localToFirebase(values);

  let key = movement.key;
  delete movement.key;

  key = yield call(remote.saveMovement, '/departures', key, movement);

  yield put(actions.saveDepartureSuccess(key))
}

export default function* sagas() {
  const channel = createChannel();

  yield [
    fork(monitor, channel),
    fork(takeEvery, actions.LOAD_DEPARTURES, loadDepartures, channel),
    fork(takeEvery, actions.DELETE_DEPARTURE, deleteDeparture),
    fork(takeEvery, actions.INIT_NEW_DEPARTURE, initNewDeparture),
    fork(takeEvery, actions.SAVE_DEPARTURE, saveDeparture),
    fork(takeLatest, actions.EDIT_DEPARTURE, editDeparture),
  ]
}
