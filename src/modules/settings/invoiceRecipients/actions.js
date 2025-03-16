export const LOAD_INVOICE_RECIPIENT_SETTINGS = 'LOAD_INVOICE_RECIPIENT_SETTINGS';
export const LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS = 'LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS';
export const ADD_INVOICE_RECIPIENT = 'ADD_INVOICE_RECIPIENT';
export const ADD_INVOICE_RECIPIENT_EMAIL = 'ADD_INVOICE_RECIPIENT_EMAIL';
export const REMOVE_INVOICE_RECIPIENT = 'REMOVE_INVOICE_RECIPIENT';
export const REMOVE_INVOICE_RECIPIENT_EMAIL = 'REMOVE_INVOICE_RECIPIENT_EMAIL';

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

export function addInvoiceRecipient(name) {
  return {
    type: ADD_INVOICE_RECIPIENT,
    payload: {
      name
    }
  };
}

export function addInvoiceRecipientEmail(name, email) {
  return {
    type: ADD_INVOICE_RECIPIENT_EMAIL,
    payload: {
      name,
      email
    }
  };
}

export function removeInvoiceRecipient(name) {
  return {
    type: REMOVE_INVOICE_RECIPIENT,
    payload: {
      name
    }
  };
}

export function removeInvoiceRecipientEmail(name, email) {
  return {
    type: REMOVE_INVOICE_RECIPIENT_EMAIL,
    payload: {
      name,
      email
    }
  };
}
