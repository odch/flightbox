import * as actions from './actions';
import reducer from '../../util/reducer';

const INITIAL_STATE = {
  recipients: undefined,
};

const invoiceRecipientsLoaded = (state, action) => ({
  ...state,
  recipients: action.payload.invoiceRecipients
})

const ACTION_HANDLERS = {
  [actions.USER_INVOICE_RECIPIENTS_LOADED]: invoiceRecipientsLoaded,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
