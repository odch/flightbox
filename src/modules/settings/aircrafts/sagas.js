import { takeEvery } from 'redux-saga';
import { take, fork, call } from 'redux-saga/effects';
import * as actions from './actions';
import createChannel, { monitor } from '../../../util/createChannel';
import firebase from '../../../util/firebase';

function* loadByType(channel, type, path) {
  firebase(path).on('value', (snapshot) => {
    channel.put(actions.loadAircraftSettingsSuccess(type, snapshot.val() || {}));
  });
}

function* watchLoadAircrafts(channel) {
  yield take(actions.LOAD_AIRCRAFT_SETTINGS);
  yield [
    call(loadByType, channel, 'club', '/settings/aircraftsMFGT'),
    call(loadByType, channel, 'homeBase', '/settings/aircraftsLSZT')
  ];
}

export default function* sagas() {
  const channel = createChannel();
  yield [
    fork(monitor, channel),
    fork(watchLoadAircrafts, channel),
  ]
}
