import {all, call, fork, put, takeEvery} from 'redux-saga/effects';
import {runTransaction} from 'firebase/database';
import * as actions from './actions';
import {watchSettingWhileAdmin} from '../watchSettingWhileAdmin';
import firebase from '../../../util/firebase';
import {error} from '../../../util/log';
import {isValidEmail, normalizeEmail, normalizeEmailList} from '../../../util/emails';

export const SELF_DECLARATION_EMAILS_PATH = '/settings/customsSelfDeclarationEmails';

type EmailListChange = (emails: string[], email: string) => string[];

export const withEmail: EmailListChange = (emails, email) =>
  emails.includes(email) ? emails : [...emails, email];

export const withoutEmail: EmailListChange = (emails, email) =>
  emails.filter(existing => existing !== email);

// The list is written as a whole, but within a transaction on the value in
// the database rather than on the Redux state. So a change can never
// overwrite the list with a stale or not yet loaded state (e.g. right after
// signing in, or with two admins editing at the same time). The change always
// returns a list (never undefined, which would abort the transaction on the
// first, possibly empty, local guess).
export function saveEmailListChange(change: EmailListChange, email: string) {
  return runTransaction(
    firebase(SELF_DECLARATION_EMAILS_PATH),
    current => change(normalizeEmailList(current), email)
  );
}

export function* changeEmailList(change: EmailListChange, email: string) {
  yield put(actions.saveCustomsSelfDeclarationEmailsSaving());
  try {
    yield call(saveEmailListChange, change, email);
    yield put(actions.saveCustomsSelfDeclarationEmailsSuccess());
  } catch (e) {
    error('Failed to save the customs self-declaration e-mails', e);
    yield put(actions.saveCustomsSelfDeclarationEmailsFailure());
  }
}

export function* addEmail(action: ReturnType<typeof actions.addCustomsSelfDeclarationEmail>) {
  const email = normalizeEmail(action.payload.email);
  if (!isValidEmail(email)) {
    // The form validates before dispatching; never store an invalid entry.
    return;
  }
  yield call(changeEmailList, withEmail, email);
}

export function* removeEmail(action: ReturnType<typeof actions.removeCustomsSelfDeclarationEmail>) {
  yield call(changeEmailList, withoutEmail, normalizeEmail(action.payload.email));
}

export default function* sagas() {
  yield all([
    fork(watchSettingWhileAdmin, SELF_DECLARATION_EMAILS_PATH, actions.customsSelfDeclarationEmailsLoaded),
    takeEvery(actions.ADD_CUSTOMS_SELF_DECLARATION_EMAIL, addEmail),
    takeEvery(actions.REMOVE_CUSTOMS_SELF_DECLARATION_EMAIL, removeEmail),
  ])
}
