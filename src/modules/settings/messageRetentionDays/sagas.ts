import {all, call, fork, put, takeEvery} from 'redux-saga/effects';
import {set} from 'firebase/database';
import * as actions from './actions';
import {watchSettingWhileAdmin} from '../watchSettingWhileAdmin';
import firebase from '../../../util/firebase';

export function* setMessageRetentionDays(action: any) {
  yield put(actions.setMessageRetentionDaysSaving());
  yield call(saveMessageRetentionDays, action.payload.days);
  yield put(actions.setMessageRetentionDaysSuccess());
}

export function saveMessageRetentionDays(days: number | null) {
  return set(firebase('/settings/messageRetentionDays'), days);
}

export default function* sagas() {
  yield all([
    fork(watchSettingWhileAdmin, '/settings/messageRetentionDays', actions.messageRetentionDaysLoaded),
    takeEvery(actions.SET_MESSAGE_RETENTION_DAYS, setMessageRetentionDays),
  ])
}
