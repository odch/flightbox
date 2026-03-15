import * as actions from './actions';
import { SettingsInvoiceRecipientsAction, InvoiceRecipient } from './actions';
import reducer from '../../../util/reducer';

interface SettingsInvoiceRecipientsState {
  loaded: boolean;
  recipients: InvoiceRecipient[];
}

const INITIAL_STATE: SettingsInvoiceRecipientsState = {
  loaded: false,
  recipients: []
};

function loadInvoiceRecipientsSettingsSuccess(state: SettingsInvoiceRecipientsState, action: SettingsInvoiceRecipientsAction & { type: typeof actions.LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS }) {
  return {
    loaded: true,
    recipients: action.payload.recipients
  }
}

const ACTION_HANDLERS = {
  [actions.LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS]: loadInvoiceRecipientsSettingsSuccess,
};

export type { SettingsInvoiceRecipientsState };
export default reducer<SettingsInvoiceRecipientsState, SettingsInvoiceRecipientsAction>(INITIAL_STATE, ACTION_HANDLERS);
