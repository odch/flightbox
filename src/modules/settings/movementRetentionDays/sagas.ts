import {all, call, fork, put, takeEvery} from 'redux-saga/effects';
import {onValue, set} from 'firebase/database';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

export function loadMovementRetentionDays(channel: any) {
  onValue(firebase('/settings/movementRetentionDays'), (snapshot) => {
    channel.put(actions.movementRetentionDaysLoaded(snapshot.val()));
  });
}

export function* setMovementRetentionDays(action: any) {
  yield put(actions.setMovementRetentionDaysSaving());
  yield call(saveMovementRetentionDays, action.payload.days);
  yield put(actions.setMovementRetentionDaysSuccess());
}

export function saveMovementRetentionDays(days: number | null) {
  return set(firebase('/settings/movementRetentionDays'), days);
}

export default function* sagas() {
  const channel = createChannel();
  yield all([
    fork(monitor, channel),
    fork(loadMovementRetentionDays, channel),
    takeEvery(actions.SET_MOVEMENT_RETENTION_DAYS, setMovementRetentionDays),
  ])
}
