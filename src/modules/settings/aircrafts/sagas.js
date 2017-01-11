import { takeEvery } from 'redux-saga';
import { take, fork, call, put } from 'redux-saga/effects';
import * as actions from './actions';
import createChannel, { monitor } from '../../../util/createChannel';
import firebase from '../../../util/firebase';

const paths = {
  club: '/settings/aircrafts/club',
  homeBase: '/settings/aircrafts/homeBase',
};

function* loadByType(channel, type) {
  firebase(paths[type]).on('value', (snapshot) => {
    channel.put(actions.loadAircraftSettingsSuccess(type, snapshot.val() || {}));
  });
}

function* add(type, name) {
  return new Promise((resolve, reject) => {
    firebase(paths[type]).child(name).set(true, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function* remove(type, name) {
  return new Promise((resolve, reject) => {
    firebase(paths[type]).child(name).remove(error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function* watchLoadAircrafts(channel) {
  yield take(actions.LOAD_AIRCRAFT_SETTINGS);
  yield [
    call(loadByType, channel, 'club'),
    call(loadByType, channel, 'homeBase')
  ];
}

function* addAircraft(action) {
  const { type, name } = action.payload;
  if (name) {
    yield call(add, type, name);
    yield put(actions.addAircraftSuccess(type, name));
  }
}

function* removeAircraft(action) {
  yield call(remove, action.payload.type, action.payload.name);
}

export default function* sagas() {
  const channel = createChannel();
  yield [
    fork(monitor, channel),
    fork(watchLoadAircrafts, channel),
    fork(takeEvery, actions.ADD_AIRCRAFT, addAircraft),
    fork(takeEvery, actions.REMOVE_AIRCRAFT, removeAircraft),
  ]
}
