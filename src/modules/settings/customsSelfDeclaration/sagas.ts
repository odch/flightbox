import {all, call, fork, put, takeEvery} from 'redux-saga/effects';
import {runTransaction} from 'firebase/database';
import * as actions from './actions';
import {watchSettingWhileAdmin} from '../watchSettingWhileAdmin';
import firebase from '../../../util/firebase';
import {error} from '../../../util/log';
import {isValidEmail, normalizeEmail} from '../../../util/emails';
import {
  isValidRegistration,
  normalizeRegistration,
  normalizeSelfDeclarants,
  SelfDeclarant,
} from '../../../util/selfDeclarants';

// The path keeps its original name (from when it held plain e-mails), as the
// Cloud Function pushing it to the customs app listens on it.
export const SELF_DECLARANTS_PATH = '/settings/customsSelfDeclarationEmails';

type SelfDeclarantsChange = (selfDeclarants: SelfDeclarant[], email: string, registration?: string) => SelfDeclarant[];

export const withSelfDeclarant: SelfDeclarantsChange = (selfDeclarants, email) =>
  selfDeclarants.some(selfDeclarant => selfDeclarant.email === email)
    ? selfDeclarants
    : [...selfDeclarants, {email, registrations: []}];

export const withoutSelfDeclarant: SelfDeclarantsChange = (selfDeclarants, email) =>
  selfDeclarants.filter(selfDeclarant => selfDeclarant.email !== email);

// A person removed in the meantime (e.g. by another admin) is not added back.
export const withAircraft: SelfDeclarantsChange = (selfDeclarants, email, registration) =>
  selfDeclarants.map(selfDeclarant =>
    selfDeclarant.email === email && registration !== undefined && !selfDeclarant.registrations.includes(registration)
      ? {...selfDeclarant, registrations: [...selfDeclarant.registrations, registration]}
      : selfDeclarant
  );

export const withoutAircraft: SelfDeclarantsChange = (selfDeclarants, email, registration) =>
  selfDeclarants.map(selfDeclarant =>
    selfDeclarant.email === email
      ? {...selfDeclarant, registrations: selfDeclarant.registrations.filter(existing => existing !== registration)}
      : selfDeclarant
  );

// The list is written as a whole, but within a transaction on the value in
// the database rather than on the Redux state. So a change can never
// overwrite the list with a stale or not yet loaded state (e.g. right after
// signing in, or with two admins editing at the same time). The change always
// returns a list (never undefined, which would abort the transaction on the
// first, possibly empty, local guess). Normalising the stored value also
// converts entries of the first version (plain e-mail strings) to persons
// without aircraft.
export function saveSelfDeclarantsChange(change: SelfDeclarantsChange, email: string, registration?: string) {
  return runTransaction(
    firebase(SELF_DECLARANTS_PATH),
    current => change(normalizeSelfDeclarants(current), email, registration)
  );
}

export function* changeSelfDeclarants(change: SelfDeclarantsChange, email: string, registration?: string) {
  yield put(actions.saveCustomsSelfDeclarantsSaving());
  try {
    yield call(saveSelfDeclarantsChange, change, email, registration);
    yield put(actions.saveCustomsSelfDeclarantsSuccess());
  } catch (e) {
    error('Failed to save the customs self-declarants', e);
    yield put(actions.saveCustomsSelfDeclarantsFailure());
  }
}

export function* addSelfDeclarant(action: ReturnType<typeof actions.addCustomsSelfDeclarant>) {
  const email = normalizeEmail(action.payload.email);
  if (!isValidEmail(email)) {
    // The form validates before dispatching; never store an invalid entry.
    return;
  }
  yield call(changeSelfDeclarants, withSelfDeclarant, email);
}

export function* removeSelfDeclarant(action: ReturnType<typeof actions.removeCustomsSelfDeclarant>) {
  yield call(changeSelfDeclarants, withoutSelfDeclarant, normalizeEmail(action.payload.email));
}

export function* addAircraft(action: ReturnType<typeof actions.addCustomsSelfDeclarantAircraft>) {
  const registration = normalizeRegistration(action.payload.registration);
  if (!isValidRegistration(registration)) {
    // The form validates before dispatching; never store an invalid entry.
    return;
  }
  yield call(changeSelfDeclarants, withAircraft, normalizeEmail(action.payload.email), registration);
}

export function* removeAircraft(action: ReturnType<typeof actions.removeCustomsSelfDeclarantAircraft>) {
  yield call(
    changeSelfDeclarants,
    withoutAircraft,
    normalizeEmail(action.payload.email),
    normalizeRegistration(action.payload.registration)
  );
}

export default function* sagas() {
  yield all([
    fork(watchSettingWhileAdmin, SELF_DECLARANTS_PATH, actions.customsSelfDeclarantsLoaded),
    takeEvery(actions.ADD_CUSTOMS_SELF_DECLARANT, addSelfDeclarant),
    takeEvery(actions.REMOVE_CUSTOMS_SELF_DECLARANT, removeSelfDeclarant),
    takeEvery(actions.ADD_CUSTOMS_SELF_DECLARANT_AIRCRAFT, addAircraft),
    takeEvery(actions.REMOVE_CUSTOMS_SELF_DECLARANT_AIRCRAFT, removeAircraft),
  ])
}
