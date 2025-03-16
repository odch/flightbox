import * as actions from './actions';
import reducer from '../../../util/reducer';

const INITIAL_STATE = {
  loaded: false,
  recipients: []
};

function loadInvoiceRecipientsSettingsSuccess(state, action) {
  return {
    loaded: true,
    recipients: action.payload.recipients
  }
}

const ACTION_HANDLERS = {
  [actions.LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS]: loadInvoiceRecipientsSettingsSuccess,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
