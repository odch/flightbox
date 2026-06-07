import {all, call, fork, put, takeEvery} from 'redux-saga/effects';
import {onValue, set} from 'firebase/database';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

export function loadAerodromeStatusBannerEnabled(channel: any) {
  onValue(firebase('/settings/aerodromeStatusBannerEnabled'), (snapshot) => {
    channel.put(actions.aerodromeStatusBannerEnabledLoaded(snapshot.val() === true));
  });
}

export function* setAerodromeStatusBannerEnabled(action: any) {
  yield put(actions.setAerodromeStatusBannerEnabledSaving());
  yield call(saveAerodromeStatusBannerEnabled, action.payload.enabled);
  yield put(actions.setAerodromeStatusBannerEnabledSuccess());
}

export function saveAerodromeStatusBannerEnabled(enabled: boolean) {
  return set(firebase('/settings/aerodromeStatusBannerEnabled'), enabled);
}

export default function* sagas() {
  const channel = createChannel();
  yield all([
    fork(monitor, channel),
    fork(loadAerodromeStatusBannerEnabled, channel),
    takeEvery(actions.SET_AERODROME_STATUS_BANNER_ENABLED, setAerodromeStatusBannerEnabled),
  ])
}
