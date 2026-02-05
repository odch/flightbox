import {all, fork} from 'redux-saga/effects';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

function* loadGuestAccessToken(channel) {
  firebase('/settings/guestAccessToken').on('value', (snapshot) => {
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
