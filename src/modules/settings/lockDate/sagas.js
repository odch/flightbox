import {all, call, fork, put, take, takeEvery} from 'redux-saga/effects';
import {onValue, set} from 'firebase/database';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

export function* watchLoadLockDate(channel) {
  yield take(actions.LOAD_LOCK_DATE);
  yield put(actions.lockDateLoading());
  onValue(firebase('/settings/lockDate'), (snapshot) => {
    channel.put(actions.lockDateLoaded(snapshot.val()));
  });
}

export function* setLockDate(action) {
  yield put(actions.setLockDateSaving());
  yield call(saveLockDate, action.payload.lockDate);
  yield put(actions.setLockDateSuccess());
}

export function saveLockDate(date) {
  return set(firebase('/settings/lockDate'), date);
}

export default function* sagas() {
  const channel = createChannel();
  yield all([
    fork(monitor, channel),
    fork(watchLoadLockDate, channel),
    takeEvery(actions.SET_LOCK_DATE, setLockDate),
  ])
}
