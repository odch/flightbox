import {END, eventChannel, Task} from 'redux-saga';
import {cancel, fork, put, take, takeEvery} from 'redux-saga/effects';
import {onValue} from 'firebase/database';
import {FIREBASE_AUTHENTICATION_EVENT} from '../auth/actions';
import firebase from '../../util/firebase';
import {error} from '../../util/log';

type LoadedActionCreator = (value: any) => { type: string };

// Emits `loaded(value)` for every change at `path`. Closing the channel
// removes the Firebase listener. If Firebase cancels the listener (e.g.
// permission denied), the error is logged and the channel ends.
export function createSettingChannel(path: string, loaded: LoadedActionCreator) {
  return eventChannel(emit => onValue(
    firebase(path),
    snapshot => emit(loaded(snapshot.val())),
    e => {
      error(`Listener for ${path} was cancelled`, e);
      emit(END);
    }
  ));
}

export function* listenToSetting(path: string, loaded: LoadedActionCreator) {
  const channel = createSettingChannel(path, loaded);
  try {
    while (true) {
      const action = yield take(channel);
      yield put(action);
    }
  } finally {
    channel.close();
  }
}

// Admin-only settings can only be read once an admin is signed in, and
// Firebase drops a listener for good when a read is denied. So listen while
// an admin is signed in, and stop (and reset the value) otherwise.
export function* watchSettingWhileAdmin(path: string, loaded: LoadedActionCreator) {
  let listener: Task | null = null;

  yield takeEvery(FIREBASE_AUTHENTICATION_EVENT, function* (action: any) {
    const authData = action.payload.authData;
    const isAdmin = !!authData && authData.admin === true;

    if (isAdmin) {
      if (!listener || !listener.isRunning()) {
        listener = yield fork(listenToSetting, path, loaded);
      }
    } else if (listener) {
      yield cancel(listener);
      listener = null;
      yield put(loaded(null));
    }
  });
}
