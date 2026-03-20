import {all, call, fork, put, takeEvery} from 'redux-saga/effects';
import {onValue, set} from 'firebase/database';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

export function loadMessageRetentionDays(channel: any) {
  onValue(firebase('/settings/messageRetentionDays'), (snapshot) => {
    channel.put(actions.messageRetentionDaysLoaded(snapshot.val()));
  });
}

export function* setMessageRetentionDays(action: any) {
  yield put(actions.setMessageRetentionDaysSaving());
  yield call(saveMessageRetentionDays, action.payload.days);
  yield put(actions.setMessageRetentionDaysSuccess());
}

export function saveMessageRetentionDays(days: number | null) {
  return set(firebase('/settings/messageRetentionDays'), days);
}

export default function* sagas() {
  const channel = createChannel();
  yield all([
    fork(monitor, channel),
    fork(loadMessageRetentionDays, channel),
    takeEvery(actions.SET_MESSAGE_RETENTION_DAYS, setMessageRetentionDays),
  ])
}
