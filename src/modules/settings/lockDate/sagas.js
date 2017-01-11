import { takeEvery } from 'redux-saga';
import { take, call, put, fork, select } from 'redux-saga/effects';
import * as actions from './actions';
import createChannel, { monitor } from '../../../util/createChannel';
import firebase from '../../../util/firebase';

function* watchLoadLockDate(channel) {
  yield take(actions.LOAD_LOCK_DATE);
  yield put(actions.lockDateLoading());
  firebase('/settings/lockDate').on('value', (snapshot) => {
    channel.put(actions.lockDateLoaded(snapshot.val()));
  });
}

function* setLockDate(action) {
  yield put(actions.setLockDateSaving());
  yield call(saveLockDate, action.payload.lockDate);
  yield put(actions.setLockDateSuccess());
}

function saveLockDate(date) {
  return new Promise((resolve) => {
    firebase('/settings/lockDate').set(date, () => {
      resolve();
    });
  });
}

export default function* sagas() {
  const channel = createChannel();
  yield [
    fork(monitor, channel),
    fork(watchLoadLockDate, channel),
    fork(takeEvery, actions.SET_LOCK_DATE, setLockDate),
  ]
}
