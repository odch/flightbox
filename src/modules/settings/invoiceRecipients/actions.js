export const LOAD_INVOICE_RECIPIENT_SETTINGS = 'LOAD_INVOICE_RECIPIENT_SETTINGS';
export const LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS = 'LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS';

export function loadInvoiceRecipientSettings() {
  return {
    type: LOAD_INVOICE_RECIPIENT_SETTINGS,
  };
}

export function loadInvoiceRecipientSettingsSuccess(recipients) {
  return {
    type: LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS,
    payload: {
      recipients
    },
  };
}
