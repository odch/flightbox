import * as actions from './actions'
import {takeEvery} from 'redux-saga'
import {call, fork, put} from 'redux-saga/effects'
import {getIdToken} from '../../util/firebase'

export function* loadUserInvoiceRecipients() {
  try {
    const idToken = yield call(getIdToken)
    const url = `https://us-central1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/api/users/me/invoice-recipients`
    const response = yield call(fetch, url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get user invoice recipients: ${response.status} ${response.statusText}`)
    }

    const invoiceRecipients = yield call([response, response.json])

    yield put(actions.userInvoiceRecipientsLoaded(invoiceRecipients));
  } catch(e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to load user invoice recipients', e);
    }
  }
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.LOAD_USER_INVOICE_RECIPIENTS, loadUserInvoiceRecipients),
  ]
}
