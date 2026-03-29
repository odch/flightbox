import * as actions from './actions'
import * as remote from './remote'
import {FIREBASE_AUTHENTICATION_EVENT} from '../auth'
import {all, call, put, select, takeEvery} from 'redux-saga/effects'

const str = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const nr = (value: unknown): number | null =>
  typeof value === 'number' ? value : null;

export const authSelector = (state: any) => state.auth.data;
export const privacyPolicyUrlSelector = (state: any) => state.settings.privacyPolicyUrl.url;

export function* loadProfile() {
  try {
    const auth = yield select(authSelector)
    const snapshot = yield call(remote.load, auth.uid);
    const profile = snapshot.val() || {};
    yield put(actions.profileLoaded(profile));
    yield call(recordPrivacyPolicyAcceptance, auth, profile);
  } catch(e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to load profile', e);
    }
  }
}

export function* recordPrivacyPolicyAcceptance(auth: any, profile: any) {
  if (auth.guest || auth.kiosk || auth.uid === 'ipauth') {
    return;
  }
  const privacyPolicyUrl = yield select(privacyPolicyUrlSelector);
  if (!privacyPolicyUrl) {
    return;
  }
  if (!profile.privacyPolicyAcceptedAt) {
    yield call(remote.save, auth.uid, {
      privacyPolicyAcceptedAt: new Date().toISOString()
    });
  }
}

export function* saveProfile(action: any) {
  try {
    const values = action.payload.values;

    const auth = yield select(authSelector);

    if (!auth || auth.guest || auth.kiosk || auth.uid === 'ipauth') {
      throw new Error('Current user not allowed to save profile');
    }

    const valuesToSave = {
      memberNr: str(values.memberNr),
      email: str(values.email),
      firstname: str(values.firstname),
      lastname: str(values.lastname),
      phone: str(values.phone),
      immatriculation: str(values.immatriculation),
      aircraftCategory: str(values.aircraftCategory),
      aircraftType: str(values.aircraftType),
      mtow: nr(values.mtow)
    }

    yield call(remote.save, auth.uid, valuesToSave);
    yield call(loadProfile);
    yield put(actions.saveProfileSuccess());
  } catch(e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to save profile', e);
    }
    yield put(actions.saveProfileFailure());
  }
}

export function* onAuthentication(action: any) {
  const authData = action.payload.authData;
  if (authData && authData.guest === false && authData.kiosk === false) {
    yield call(loadProfile);
  }
}

export default function* sagas() {
  yield all([
    takeEvery(actions.LOAD_PROFILE, loadProfile),
    takeEvery(actions.SAVE_PROFILE, saveProfile),
    takeEvery(FIREBASE_AUTHENTICATION_EVENT, onAuthentication),
  ])
}
