import {all, call, fork, put, take, takeEvery} from 'redux-saga/effects';
import {onValue, set, remove as fbRemove, child} from 'firebase/database';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

const paths = {
  club: '/settings/aircrafts/club',
  homeBase: '/settings/aircrafts/homeBase',
};

export function loadByType(channel, type) {
  onValue(firebase(paths[type]), (snapshot) => {
    channel.put(actions.loadAircraftSettingsSuccess(type, snapshot.val() || {}));
  });
}

export function add(type, name) {
  return set(child(firebase(paths[type]), name), true);
}

export function remove(type, name) {
  return fbRemove(child(firebase(paths[type]), name));
}

export function* watchLoadAircrafts(channel) {
  yield take(actions.LOAD_AIRCRAFT_SETTINGS);
  yield all([
    call(loadByType, channel, 'club'),
    call(loadByType, channel, 'homeBase')
  ])
}

export function* addAircraft(action) {
  const { type, name } = action.payload;
  if (name) {
    yield call(add, type, name);
    yield put(actions.addAircraftSuccess(type, name));
  }
}

export function* removeAircraft(action) {
  yield call(remove, action.payload.type, action.payload.name);
}

export default function* sagas() {
  const channel = createChannel();
  yield all([
    fork(monitor, channel),
    fork(watchLoadAircrafts, channel),
    takeEvery(actions.ADD_AIRCRAFT, addAircraft),
    takeEvery(actions.REMOVE_AIRCRAFT, removeAircraft),
  ])
}
