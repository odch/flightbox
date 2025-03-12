import {call, fork, take} from 'redux-saga/effects';
import * as actions from './actions';
import createChannel, {monitor} from '../../../util/createChannel';
import firebase from '../../../util/firebase';

function* loadRecipients(channel) {
  firebase('/settings/invoiceRecipients').on('value', (snapshot) => {
    channel.put(actions.loadInvoiceRecipientSettingsSuccess(snapshot.val() || []));
  });
}

function* watchLoadRecipients(channel) {
  yield take(actions.LOAD_INVOICE_RECIPIENT_SETTINGS);
  yield call(loadRecipients, channel)
}

export default function* sagas() {
  const channel = createChannel();
  yield [
    fork(monitor, channel),
    fork(watchLoadRecipients, channel)
  ]
}
