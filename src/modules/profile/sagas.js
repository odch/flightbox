import * as actions from './actions'
import * as remote from './remote'
import {takeEvery} from 'redux-saga'
import {call, fork, put, select} from 'redux-saga/effects'
import {getFormValues, initialize} from 'redux-form'

const str = (value) => typeof value === 'string' && value.trim().length > 0 ? value : null

const nr = (value) => typeof value === 'number' ? value : null

export const authSelector = state => state.auth.data

export function* loadProfile() {
  try {
    const auth = yield select(authSelector)
    const snapshot = yield call(remote.load, auth.uid);
    yield put(initialize('profile', snapshot.val() || {}));
    yield put(actions.profileLoaded(snapshot.val() || {}));
  } catch(e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to load profile', e);
    }
  }
}

export function* saveProfile(action) {
  try {
    const values = yield select(getFormValues('profile'));

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

export default function* sagas() {
  yield [
    fork(takeEvery, actions.LOAD_PROFILE, loadProfile),
    fork(takeEvery, actions.SAVE_PROFILE, saveProfile),
  ]
}
