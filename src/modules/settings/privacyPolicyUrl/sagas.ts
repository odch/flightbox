import {all, call, fork, put, takeEvery} from 'redux-saga/effects';
import {onValue, set} from 'firebase/database';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

export function loadPrivacyPolicyUrl(channel: any) {
  onValue(firebase('/settings/privacyPolicyUrl'), (snapshot) => {
    channel.put(actions.privacyPolicyUrlLoaded(snapshot.val()));
  });
}

export function* setPrivacyPolicyUrl(action: any) {
  yield put(actions.setPrivacyPolicyUrlSaving());
  yield call(savePrivacyPolicyUrl, action.payload.url);
  yield put(actions.setPrivacyPolicyUrlSuccess());
}

export function savePrivacyPolicyUrl(url: string | null) {
  return set(firebase('/settings/privacyPolicyUrl'), url);
}

export default function* sagas() {
  const channel = createChannel();
  yield all([
    fork(monitor, channel),
    fork(loadPrivacyPolicyUrl, channel),
    takeEvery(actions.SET_PRIVACY_POLICY_URL, setPrivacyPolicyUrl),
  ])
}
