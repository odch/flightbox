import * as actions from './actions'
import * as remote from './remote'
import { migrateProfile, toAircraftsArray } from './migration'
import {FIREBASE_AUTHENTICATION_EVENT} from '../auth'
import {all, call, put, select, takeEvery} from 'redux-saga/effects'
import i18n from '../../i18n'

const str = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const sortAircrafts = (aircrafts: any[]) =>
  [...aircrafts].sort((a, b) => (a.immatriculation || '').localeCompare(b.immatriculation || ''));

export const authSelector = (state: any) => state.auth.data;
export const privacyPolicyUrlSelector = (state: any) => state.settings.privacyPolicyUrl.url;

export function* loadProfile() {
  try {
    const auth = yield select(authSelector)
    const snapshot = yield call(remote.load, auth.uid);
    const rawProfile = snapshot.val() || {};
    const { profile, needsMigration } = migrateProfile(rawProfile);

    if (needsMigration && auth.uid !== 'ipauth' && !auth.guest && !auth.kiosk) {
      try {
        yield call(remote.migrateAircrafts, auth.uid, profile.aircrafts as any[]);
      } catch (migrationError) {
        if (console && typeof console.error === 'function') {
          console.error('Failed to persist profile migration', migrationError);
        }
      }
    }

    yield put(actions.profileLoaded(profile));
    if (profile.language && profile.language !== i18n.language) {
      i18n.changeLanguage(profile.language as string);
    }
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

export function* addAircraftSaga(action: any) {
  try {
    const auth = yield select(authSelector);

    if (!auth || auth.guest || auth.kiosk || auth.uid === 'ipauth') {
      throw new Error('Current user not allowed to save profile');
    }

    const snapshot = yield call(remote.load, auth.uid);
    const profile = snapshot.val() || {};
    const currentAircrafts = toAircraftsArray(profile.aircrafts) || [];
    const duplicate = currentAircrafts.some(
      (a: any) => a.immatriculation === action.payload.aircraft.immatriculation
    );
    if (duplicate) {
      return;
    }
    const newAircrafts = sortAircrafts([...currentAircrafts, action.payload.aircraft]);
    yield call(remote.saveAircraftsList, auth.uid, newAircrafts);
    yield call(loadProfile);
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to add aircraft', e);
    }
  }
}

export function* updateAircraftSaga(action: any) {
  try {
    const auth = yield select(authSelector);

    if (!auth || auth.guest || auth.kiosk || auth.uid === 'ipauth') {
      throw new Error('Current user not allowed to save profile');
    }

    const snapshot = yield call(remote.load, auth.uid);
    const profile = snapshot.val() || {};
    const currentAircrafts = toAircraftsArray(profile.aircrafts) || [];
    const duplicate = currentAircrafts.some(
      (a: any, i: number) => i !== action.payload.index && a.immatriculation === action.payload.aircraft.immatriculation
    );
    if (duplicate) {
      return;
    }
    const newAircrafts = sortAircrafts(currentAircrafts.map((a: any, i: number) =>
      i === action.payload.index ? action.payload.aircraft : a
    ));
    yield call(remote.saveAircraftsList, auth.uid, newAircrafts);
    yield call(loadProfile);
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to update aircraft', e);
    }
  }
}

export function* removeAircraftSaga(action: any) {
  try {
    const auth = yield select(authSelector);

    if (!auth || auth.guest || auth.kiosk || auth.uid === 'ipauth') {
      throw new Error('Current user not allowed to save profile');
    }

    const snapshot = yield call(remote.load, auth.uid);
    const profile = snapshot.val() || {};
    const currentAircrafts = toAircraftsArray(profile.aircrafts) || [];
    const newAircrafts = currentAircrafts.filter((_: any, i: number) => i !== action.payload.index);
    yield call(remote.saveAircraftsList, auth.uid, newAircrafts);
    yield call(loadProfile);
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to remove aircraft', e);
    }
  }
}

export function* saveLanguage(action: any) {
  try {
    const auth = yield select(authSelector);
    if (!auth || auth.guest || auth.kiosk || auth.uid === 'ipauth') {
      return;
    }
    yield call(remote.save, auth.uid, { language: action.payload.language });
  } catch (e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to save language preference', e);
    }
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
    takeEvery(actions.SAVE_LANGUAGE, saveLanguage),
    takeEvery(actions.ADD_PROFILE_AIRCRAFT, addAircraftSaga),
    takeEvery(actions.UPDATE_PROFILE_AIRCRAFT, updateAircraftSaga),
    takeEvery(actions.REMOVE_PROFILE_AIRCRAFT, removeAircraftSaga),
    takeEvery(FIREBASE_AUTHENTICATION_EVENT, onAuthentication),
  ])
}
