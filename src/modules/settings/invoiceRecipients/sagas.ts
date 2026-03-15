import {all, call, fork, select, take, takeEvery} from 'redux-saga/effects';
import {onValue, set} from 'firebase/database';
import * as actions from './actions';
import { InvoiceRecipient } from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

export const invoiceRecipientsSelector = (state: any): InvoiceRecipient[] => state.settings.invoiceRecipients.recipients;

export function loadRecipients(channel: any) {
  onValue(firebase('/settings/invoiceRecipients'), (snapshot) => {
    channel.put(actions.loadInvoiceRecipientSettingsSuccess(snapshot.val() || []));
  });
}

export function* watchLoadRecipients(channel: any) {
  yield take(actions.LOAD_INVOICE_RECIPIENT_SETTINGS);
  yield call(loadRecipients, channel)
}

export function* addInvoiceRecipient(action: any) {
  const currentRecipients: InvoiceRecipient[] = yield select(invoiceRecipientsSelector)
  const newRecipients = [
    ...currentRecipients,
    {
      name: action.payload.name
    }
  ]
  yield call(saveInvoiceRecipients, newRecipients);
}

export function* addInvoiceRecipientEmail(action: any) {
  const currentRecipients: InvoiceRecipient[] = yield select(invoiceRecipientsSelector)
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

export function* removeInvoiceRecipient(action: any) {
  const currentRecipients: InvoiceRecipient[] = yield select(invoiceRecipientsSelector)
  const newRecipients = currentRecipients.filter(recipient => recipient.name !== action.payload.name)
  yield call(saveInvoiceRecipients, newRecipients);
}

export function* removeInvoiceRecipientEmail(action: any) {
  const currentRecipients: InvoiceRecipient[] = yield select(invoiceRecipientsSelector)
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

export function saveInvoiceRecipients(invoiceRecipients: InvoiceRecipient[]) {
  return set(firebase('/settings/invoiceRecipients'), invoiceRecipients);
}

export default function* sagas() {
  const channel = createChannel();
  yield all([
    fork(monitor, channel),
    fork(watchLoadRecipients, channel),
    takeEvery(actions.ADD_INVOICE_RECIPIENT, addInvoiceRecipient),
    takeEvery(actions.ADD_INVOICE_RECIPIENT_EMAIL, addInvoiceRecipientEmail),
    takeEvery(actions.REMOVE_INVOICE_RECIPIENT, removeInvoiceRecipient),
    takeEvery(actions.REMOVE_INVOICE_RECIPIENT_EMAIL, removeInvoiceRecipientEmail),
  ])
}
