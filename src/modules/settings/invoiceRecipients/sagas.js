import {call, fork, select, take} from 'redux-saga/effects';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';
import {takeEvery} from 'redux-saga'

export const invoiceRecipientsSelector = state => state.settings.invoiceRecipients.recipients;

function* loadRecipients(channel) {
  firebase('/settings/invoiceRecipients').on('value', (snapshot) => {
    channel.put(actions.loadInvoiceRecipientSettingsSuccess(snapshot.val() || []));
  });
}

function* watchLoadRecipients(channel) {
  yield take(actions.LOAD_INVOICE_RECIPIENT_SETTINGS);
  yield call(loadRecipients, channel)
}

function* addInvoiceRecipient(action) {
  const currentRecipients = yield select(invoiceRecipientsSelector)
  const newRecipients = [
    ...currentRecipients,
    {
      name: action.payload.name
    }
  ]
  yield call(saveInvoiceRecipients, newRecipients);
}

function* addInvoiceRecipientEmail(action) {
  const currentRecipients = yield select(invoiceRecipientsSelector)
  const newRecipients = currentRecipients.map(recipient =>
    recipient.name === action.payload.name
      ? ({
        ...recipient,
        emails: [
          ...(recipient.emails || []),
          action.payload.email
        ]
      })
      : recipient
  )
  yield call(saveInvoiceRecipients, newRecipients);
}

function* removeInvoiceRecipient(action) {
  const currentRecipients = yield select(invoiceRecipientsSelector)
  const newRecipients = currentRecipients.filter(recipient => recipient.name !== action.payload.name)
  yield call(saveInvoiceRecipients, newRecipients);
}

function* removeInvoiceRecipientEmail(action) {
  const currentRecipients = yield select(invoiceRecipientsSelector)
  const newRecipients = currentRecipients.map(recipient =>
    recipient.name === action.payload.name
      ? ({
        ...recipient,
        emails: (recipient.emails || []).filter(email => email !== action.payload.email)
      })
      : recipient
  )
  yield call(saveInvoiceRecipients, newRecipients);
}

function* saveInvoiceRecipients(invoiceRecipients) {
  return new Promise(async (resolve, reject) => {
    try {
      await firebase('/settings/invoiceRecipients').set(invoiceRecipients);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export default function* sagas() {
  const channel = createChannel();
  yield [
    fork(monitor, channel),
    fork(watchLoadRecipients, channel),
    fork(takeEvery, actions.ADD_INVOICE_RECIPIENT, addInvoiceRecipient),
    fork(takeEvery, actions.ADD_INVOICE_RECIPIENT_EMAIL, addInvoiceRecipientEmail),
    fork(takeEvery, actions.REMOVE_INVOICE_RECIPIENT, removeInvoiceRecipient),
    fork(takeEvery, actions.REMOVE_INVOICE_RECIPIENT_EMAIL, removeInvoiceRecipientEmail),
  ]
}
