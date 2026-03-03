import * as actions from './actions';
import { InvoiceRecipientsAction } from './actions';
import reducer from '../../util/reducer';

interface InvoiceRecipientsState {
  recipients: unknown[] | undefined;
}

const INITIAL_STATE: InvoiceRecipientsState = {
  recipients: undefined,
};

const invoiceRecipientsLoaded = (state: InvoiceRecipientsState, action: InvoiceRecipientsAction & { type: typeof actions.USER_INVOICE_RECIPIENTS_LOADED }) => ({
  ...state,
  recipients: action.payload.invoiceRecipients
});

const ACTION_HANDLERS = {
  [actions.USER_INVOICE_RECIPIENTS_LOADED]: invoiceRecipientsLoaded,
};

export type { InvoiceRecipientsState };
export default reducer<InvoiceRecipientsState, InvoiceRecipientsAction>(INITIAL_STATE, ACTION_HANDLERS);
