import {all, fork} from 'redux-saga/effects';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

function* loadKioskAccessToken(channel) {
  firebase('/settings/kioskAccessToken').on('value', (snapshot) => {
    channel.put(actions.kioskAccessTokenLoaded(snapshot.val()));
  });
}

export default function* sagas() {
  const channel = createChannel();
  yield all([
    fork(monitor, channel),
    fork(loadKioskAccessToken, channel),
  ])
}
