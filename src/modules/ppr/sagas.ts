import {all, call, put, race, take, takeEvery, takeLatest, takeLeading} from 'redux-saga/effects'
import {history} from '../../history'
import {getIdToken} from '../../util/firebase'
import i18n from '../../i18n'
import {normalizeEmail} from '../../util/emails'
import {getProfileDefaultValues} from '../movements/sagas'
import * as actions from './actions';
import * as remote from './remote';
import {getDefaultPlannedDateTime} from './plannedDefaults';

export function* initPprForm() {
  // Today, about two hours ahead (the pilot adjusts it)
  const planned = yield call(getDefaultPlannedDateTime);
  try {
    const profileValues = yield call(getProfileDefaultValues);
    yield put(actions.pprFormInitialized({...profileValues, ...planned}));
  } catch (e) {
    yield put(actions.pprFormInitialized({...planned}));
  }
}

export function* loadPprRequests(action: any) {
  const scope = (action && action.payload && action.payload.scope) || 'own';
  yield put(actions.setPprLoading());
  try {
    const idToken = yield call(getIdToken);
    const data = yield call(remote.loadRequests, idToken, scope);
    yield put(actions.pprRequestsLoaded(data, scope));
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to load PPR requests', e);
    }
    yield put(actions.pprLoadFailed());
  }
}

// Sends a request with the login's ID token, which may take a round trip
export function* sendPprRequest(values: Record<string, any>) {
  const idToken = yield call(getIdToken);
  // The language decides which language the pilot's emails are sent in
  return yield call(remote.submitRequest, {...values, language: i18n.language}, idToken);
}

// The answers to a page's requests are dropped once the page was left (its
// reset action came first): they would show on the next page.
export function* submitPprRequest(action: any) {
  const values = action.payload.values;
  try {
    const raced = yield race({
      result: call(sendPprRequest, values),
      reset: take(actions.RESET_PPR_FORM),
    });
    if (raced.reset) {
      return;
    }
    // Requests can be answered right away (closed aerodrome, automatic answers)
    yield put(actions.submitPprRequestSuccess(raced.result || null));
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to submit PPR request', e);
    }
    yield put(actions.submitPprRequestFailure());
  }
}

export function* reviewPprRequest(action: any) {
  const { key, status, remarks } = action.payload;
  try {
    const idToken = yield call(getIdToken);
    yield call(remote.reviewRequest, key, status, remarks, idToken);
    yield put(actions.reviewPprRequestSuccess());
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to review PPR request', e);
    }
    yield put(actions.reviewPprRequestFailure());
    return;
  }
  try {
    // Reviews happen in the admin list, which shows all requests
    yield call(loadPprRequests, actions.loadPprRequests('all'));
  } catch (e) {
    // Reload failure is non-fatal — review already succeeded
  }
}

export function* revokePprApproval(action: any) {
  const { key, remarks } = action.payload;
  try {
    const idToken = yield call(getIdToken);
    yield call(remote.revokeApproval, key, remarks, idToken);
    yield put(actions.revokePprApprovalSuccess());
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to revoke PPR approval', e);
    }
    yield put(actions.revokePprApprovalFailure());
    return;
  }
  try {
    // Revocations happen in the admin list, which shows all requests
    yield call(loadPprRequests, actions.loadPprRequests('all'));
  } catch (e) {
    // Reload failure is non-fatal — the revocation already succeeded
  }
}

export function* deletePprRequest(action: any) {
  const { key } = action.payload;
  try {
    const idToken = yield call(getIdToken);
    yield call(remote.deleteRequest, key, idToken);
    yield put(actions.deletePprRequestSuccess(key));
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to delete PPR request', e);
    }
    yield put(actions.deletePprRequestFailure());
  }
}

export function* loadPprSettings() {
  try {
    const idToken = yield call(getIdToken);
    const settings = yield call(remote.loadSettings, idToken);
    yield put(actions.pprSettingsLoaded(settings));
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to load PPR settings', e);
    }
    yield put(actions.pprSettingsLoadFailed());
  }
}

export function* savePprSettings(action: any) {
  try {
    const idToken = yield call(getIdToken);
    const settings = yield call(remote.saveSettings, action.payload.settings, idToken);
    yield put(actions.savePprSettingsSuccess(settings));
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to save PPR settings', e);
    }
    yield put(actions.savePprSettingsFailure());
  }
}

export function* confirmPprSubmitSuccess() {
  history.push('/');
  yield put(actions.resetPprForm());
}

// The HTTP status of a refusal by a route without login
const statusOf = (e: unknown) => (e as Partial<remote.PprApiError> | null)?.status;

export function* submitPprGuestRequest(action: any) {
  const values = action.payload.values;
  try {
    // The language decides which language the pilot's emails are sent in
    const raced = yield race({
      result: call(remote.submitGuestRequest, {...values, language: i18n.language}),
      reset: take(actions.RESET_PPR_FORM),
    });
    if (raced.reset) {
      return;
    }
    // Requests can be answered right away (closed aerodrome, automatic
    // answers). The dialog names the address the emails went to.
    const email = typeof values.email === 'string' ? normalizeEmail(values.email) : undefined;
    yield put(actions.submitPprRequestSuccess(raced.result ? {...raced.result, email} : null));
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to submit PPR request without login', e);
    }
    yield put(actions.submitPprRequestFailure(statusOf(e) === 429));
  }
}

export function* loadPprStatus(action: any) {
  const { key, token } = action.payload;
  try {
    const raced = yield race({
      request: call(remote.loadRequestStatus, key, token),
      reset: take(actions.RESET_PPR_STATUS),
    });
    if (raced.reset) {
      return;
    }
    yield put(actions.pprStatusLoaded(raced.request));
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to load PPR request status', e);
    }
    // An unknown request and a wrong token look the same
    yield put(actions.pprStatusLoadFailed(statusOf(e) === 404 ? 'notFound' : 'failed'));
  }
}

const withdrawFailure = (e: unknown): actions.PprWithdrawFailure => {
  switch (statusOf(e)) {
    case 409:
      return 'notPending';
    case 404:
      return 'notFound';
    default:
      return 'failed';
  }
};

export function* withdrawPprRequest(action: any) {
  const { key, token } = action.payload;
  try {
    const raced = yield race({
      withdrawn: call(remote.withdrawRequest, key, token),
      reset: take(actions.RESET_PPR_STATUS),
    });
    if (raced.reset) {
      return;
    }
    yield put(actions.withdrawPprRequestSuccess());
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to withdraw PPR request', e);
    }
    const reason = withdrawFailure(e);
    yield put(actions.withdrawPprRequestFailure(reason));
    if (reason === 'notPending') {
      // Answered in the meantime: the page shows the answer
      yield put(actions.loadPprStatus(key, token));
    }
  }
}

export default function* sagas() {
  yield all([
    takeEvery(actions.INIT_PPR_FORM, initPprForm),
    // A newer load replaces the one running: the store holds the state of
    // one load (e.g. of the admin page and the list, started together)
    takeLatest(actions.LOAD_PPR_REQUESTS, loadPprRequests),
    // Ignores further submits while one is being sent (double clicks)
    takeLeading(actions.SUBMIT_PPR_REQUEST, submitPprRequest),
    takeEvery(actions.REVIEW_PPR_REQUEST, reviewPprRequest),
    takeEvery(actions.REVOKE_PPR_APPROVAL, revokePprApproval),
    takeEvery(actions.DELETE_PPR_REQUEST, deletePprRequest),
    takeEvery(actions.CONFIRM_PPR_SUBMIT_SUCCESS, confirmPprSubmitSuccess),
    takeEvery(actions.LOAD_PPR_SETTINGS, loadPprSettings),
    takeLeading(actions.SAVE_PPR_SETTINGS, savePprSettings),
    // Its own watcher: takeLeading ignores only submits of the same type
    takeLeading(actions.SUBMIT_PPR_GUEST_REQUEST, submitPprGuestRequest),
    // The store holds the request of one link: the newest
    takeLatest(actions.LOAD_PPR_STATUS, loadPprStatus),
    // Ignores further withdrawals while one is being sent (double clicks)
    takeLeading(actions.WITHDRAW_PPR_REQUEST, withdrawPprRequest),
  ]);
}
