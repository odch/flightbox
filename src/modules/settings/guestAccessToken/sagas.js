import {all, fork} from 'redux-saga/effects';
import {onValue} from 'firebase/database';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

export function loadGuestAccessToken(channel) {
  onValue(firebase('/settings/guestAccessToken'), (snapshot) => {
    channel.put(actions.guestAccessTokenLoaded(snapshot.val()));
  });
}

export default function* sagas() {
  const channel = createChannel();
  yield all([
    fork(monitor, channel),
    fork(loadGuestAccessToken, channel),
  ])
}
