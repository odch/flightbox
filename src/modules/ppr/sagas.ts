import {all, call, put, takeEvery, takeLeading} from 'redux-saga/effects'
import {history} from '../../history'
import {getIdToken} from '../../util/firebase'
import i18n from '../../i18n'
import {getProfileDefaultValues} from '../movements/sagas'
import * as actions from './actions';
import * as remote from './remote';

export function* initPprForm() {
  try {
    const profileValues = yield call(getProfileDefaultValues);
    yield put(actions.pprFormInitialized(profileValues));
  } catch (e) {
    yield put(actions.pprFormInitialized({}));
  }
}

export function* loadPprRequests(action: any) {
  const scope = (action && action.payload && action.payload.scope) || 'own';
  yield put(actions.setPprLoading());
  try {
    const idToken = yield call(getIdToken);
    const data = yield call(remote.loadRequests, idToken, scope);
    yield put(actions.pprRequestsLoaded(data));
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to load PPR requests', e);
    }
    yield put(actions.pprLoadFailed());
  }
}

export function* submitPprRequest(action: any) {
  const values = action.payload.values;
  try {
    const idToken = yield call(getIdToken);
    // The language decides which language the pilot's emails are sent in
    yield call(remote.submitRequest, {...values, language: i18n.language}, idToken);
    yield put(actions.submitPprRequestSuccess());
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

export function* confirmPprSubmitSuccess() {
  history.push('/');
  yield put(actions.resetPprForm());
}

export default function* sagas() {
  yield all([
    takeEvery(actions.INIT_PPR_FORM, initPprForm),
    takeEvery(actions.LOAD_PPR_REQUESTS, loadPprRequests),
    // Ignores further submits while one is being sent (double clicks)
    takeLeading(actions.SUBMIT_PPR_REQUEST, submitPprRequest),
    takeEvery(actions.REVIEW_PPR_REQUEST, reviewPprRequest),
    takeEvery(actions.DELETE_PPR_REQUEST, deletePprRequest),
    takeEvery(actions.CONFIRM_PPR_SUBMIT_SUCCESS, confirmPprSubmitSuccess),
  ]);
}
