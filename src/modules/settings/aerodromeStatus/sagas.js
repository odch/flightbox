import {all, call, fork, put, select, take, takeEvery} from 'redux-saga/effects';
import * as actions from './actions';
import * as remote from './remote';
import ImmutableItemsArray from "../../../util/ImmutableItemsArray"
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

export const authSelector = state => state.auth.data

export function* loadAerodromeStatus() {
  try {
    yield put(actions.aerodromeStatusLoading());
    const snapshot = yield call(remote.loadLatest);

    const statusArray = [];
    snapshot.forEach(item => {
      const status = item.val();
      status.key = item.key;
      statusArray.push(status);
    })

    const data = {
      status: null,
      details: ''
    };

    statusArray.reverse();

    if (statusArray.length > 0) {
      const current = statusArray[0];

      data.status = current.status;
      data.details = current.details;
    }

    const latest = new ImmutableItemsArray(statusArray);

    yield put(actions.aerodromeStatusLoaded(data, latest));
  } catch(e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to load aerodrome status', e);
    }
  }
}

export function* saveAerodromeStatus(action) {
  try {
    yield put(actions.setAerodromeStatusSaving());

    const auth = yield select(authSelector);

    if (!auth || auth.admin !== true) {
      throw new Error('Current user is not authenticated as admin');
    }

    const data = {
      ...action.payload.data,
      timestamp: new Date().getTime(),
      by: auth.name ? auth.name : auth.uid
    };

    yield call(remote.save, data);
    yield put(actions.saveAerodromeStatusSuccess());

    yield call(loadAerodromeStatus);
  } catch(e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to save message', e);
    }
  }
}

export function* watchCurrentAerodromeStatus(channel) {
  yield take(actions.WATCH_CURRENT_AERODROME_STATUS);
  firebase('/status')
    .orderByChild('timestamp')
    .limitToLast(1)
    .on('value', (snapshot) => {
      const map = snapshot.val();
      const arr = map ? Object.values(map) : [];
      const status = arr.length > 0 ? arr[0] : null;
      channel.put(actions.setCurrentAerodromeStatus(status));
    });
}

export default function* sagas() {
  const aerodromeStatusChannel = createChannel();
  yield all([
    takeEvery(actions.LOAD_AERODROME_STATUS, loadAerodromeStatus),
    takeEvery(actions.SAVE_AERODROME_STATUS, saveAerodromeStatus),
    fork(monitor, aerodromeStatusChannel),
    fork(watchCurrentAerodromeStatus, aerodromeStatusChannel)
  ])
}
