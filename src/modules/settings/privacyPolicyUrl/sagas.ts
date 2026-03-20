import {all, fork} from 'redux-saga/effects';
import {onValue} from 'firebase/database';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

export function loadPrivacyPolicyUrl(channel: any) {
  onValue(firebase('/settings/privacyPolicyUrl'), (snapshot) => {
    channel.put(actions.privacyPolicyUrlLoaded(snapshot.val()));
  });
}

export default function* sagas() {
  const channel = createChannel();
  yield all([
    fork(monitor, channel),
    fork(loadPrivacyPolicyUrl, channel),
  ])
}
