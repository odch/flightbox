import {all, call, fork, put, takeEvery} from 'redux-saga/effects';
import {set} from 'firebase/database';
import * as actions from './actions';
import {watchSettingWhileAdmin} from '../watchSettingWhileAdmin';
import firebase from '../../../util/firebase';

export function* setMovementRetentionDays(action: any) {
  yield put(actions.setMovementRetentionDaysSaving());
  yield call(saveMovementRetentionDays, action.payload.days);
  yield put(actions.setMovementRetentionDaysSuccess());
}

export function saveMovementRetentionDays(days: number | null) {
  return set(firebase('/settings/movementRetentionDays'), days);
}

export default function* sagas() {
  yield all([
    fork(watchSettingWhileAdmin, '/settings/movementRetentionDays', actions.movementRetentionDaysLoaded),
    takeEvery(actions.SET_MOVEMENT_RETENTION_DAYS, setMovementRetentionDays),
  ])
}
