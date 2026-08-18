import {all, call, put, select, takeEvery, takeLeading, delay} from 'redux-saga/effects';
import * as actions from './actions';
import * as remote from './remote';
import ImmutableItemsArray from "../../../util/ImmutableItemsArray"

export const authSelector = (state: any) => state.auth.data;
export const profileSelector = (state: any) =>
  (state.profile && state.profile.profile) || {};

// How often the public status page / banner refetch the current status. The
// former Firebase onValue subscription pushed updates instantly; polling trades
// that for a small, bounded delay in exchange for not reading the DB directly.
export const POLL_INTERVAL_MS = 60000;

export function* loadAerodromeStatus() {
  try {
    yield put(actions.aerodromeStatusLoading());
    const snapshot = yield call(remote.loadLatest);

    const statusArray: any[] = [];
    snapshot.forEach((item: any) => {
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

export function* saveAerodromeStatus(action: any) {
  try {
    yield put(actions.setAerodromeStatusSaving());

    const auth = yield select(authSelector);
    const profile = yield select(profileSelector);

    if (!auth || auth.admin !== true) {
      throw new Error('Current user is not authenticated as admin');
    }

    const data = {
      ...action.payload.data,
      timestamp: new Date().getTime(),
      by: auth.name ? auth.name : auth.uid,
      uid: auth.uid,
      firstname: profile.firstname || null,
      lastname: profile.lastname || null,
      email: auth.email || null,
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

// Map the public status API response onto the shape the page/banner render
// (status code, message text, and a numeric timestamp).
export function mapCurrentStatus(response: any) {
  if (!response || !response.status) {
    return null;
  }
  return {
    status: response.status,
    details: response.message,
    timestamp: response.last_update_date
      ? new Date(response.last_update_date).getTime()
      : undefined,
  };
}

// Poll the public status API instead of subscribing to /status in the database
// directly, so the raw node can be restricted to admins and the read path is
// backend-agnostic. Started once (takeLeading) even though both the public
// status page and the start-page banner dispatch the watch action.
export function* pollCurrentAerodromeStatus() {
  while (true) {
    try {
      const response = yield call(remote.fetchCurrentStatus);
      yield put(actions.setCurrentAerodromeStatus(mapCurrentStatus(response)));
    } catch (e) {
      if (console && typeof console.error === 'function') {
        console.error('Failed to load aerodrome status', e);
      }
    }
    yield delay(POLL_INTERVAL_MS);
  }
}

export default function* sagas() {
  yield all([
    takeEvery(actions.LOAD_AERODROME_STATUS, loadAerodromeStatus),
    takeEvery(actions.SAVE_AERODROME_STATUS, saveAerodromeStatus),
    takeLeading(actions.WATCH_CURRENT_AERODROME_STATUS, pollCurrentAerodromeStatus),
  ])
}
