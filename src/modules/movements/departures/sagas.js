import { takeEvery } from 'redux-saga';
import { call, put, fork, select } from 'redux-saga/effects'
import * as actions from './actions';
import createChannel, { monitor } from '../../../util/createChannel';
import * as sharedSagas from '../shared/sagas';
import { getPagination } from '../shared/pagination';
import { loadLimited, loadMovements } from '../shared/sagas';

function* loadDepartures(channel) {
  yield sharedSagas.loadMovements(
    actions.setDeparturesLoading,
    state => state.movements.departures,
    '/departures',
    channel,
    actions.departuresAdded
  );
}

export default function* sagas() {
  const channel = createChannel();

  yield [
    fork(monitor, channel),
    fork(takeEvery, actions.LOAD_DEPARTURES, loadDepartures, channel),
  ]
}
