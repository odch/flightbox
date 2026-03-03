import {all, call, fork, put, take, takeEvery} from 'redux-saga/effects';
import {onValue, set, remove as fbRemove, child} from 'firebase/database';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

const paths: Record<string, string> = {
  club: '/settings/aircrafts/club',
  homeBase: '/settings/aircrafts/homeBase',
};

export function loadByType(channel: any, type: string) {
  onValue(firebase(paths[type]), (snapshot) => {
    channel.put(actions.loadAircraftSettingsSuccess(type, snapshot.val() || {}));
  });
}

export function add(type: string, name: string) {
  return set(child(firebase(paths[type]), name), true);
}

export function remove(type: string, name: string) {
  return fbRemove(child(firebase(paths[type]), name));
}

export function* watchLoadAircrafts(channel: any) {
  yield take(actions.LOAD_AIRCRAFT_SETTINGS);
  yield all([
    call(loadByType, channel, 'club'),
    call(loadByType, channel, 'homeBase')
  ])
}

export function* addAircraft(action: any) {
  const { type, name } = action.payload;
  if (name) {
    yield call(add, type, name);
    yield put(actions.addAircraftSuccess(type, name));
  }
}

export function* removeAircraft(action: any) {
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
