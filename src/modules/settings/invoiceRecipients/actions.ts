export const LOAD_INVOICE_RECIPIENT_SETTINGS = 'LOAD_INVOICE_RECIPIENT_SETTINGS' as const;
export const LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS = 'LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS' as const;
export const ADD_INVOICE_RECIPIENT = 'ADD_INVOICE_RECIPIENT' as const;
export const ADD_INVOICE_RECIPIENT_EMAIL = 'ADD_INVOICE_RECIPIENT_EMAIL' as const;
export const REMOVE_INVOICE_RECIPIENT = 'REMOVE_INVOICE_RECIPIENT' as const;
export const REMOVE_INVOICE_RECIPIENT_EMAIL = 'REMOVE_INVOICE_RECIPIENT_EMAIL' as const;

export interface InvoiceRecipient {
  name: string;
  emails?: string[];
}

export type SettingsInvoiceRecipientsAction =
  | { type: typeof LOAD_INVOICE_RECIPIENT_SETTINGS }
  | { type: typeof LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS; payload: { recipients: InvoiceRecipient[] } }
  | { type: typeof ADD_INVOICE_RECIPIENT; payload: { name: string } }
  | { type: typeof ADD_INVOICE_RECIPIENT_EMAIL; payload: { name: string; email: string } }
  | { type: typeof REMOVE_INVOICE_RECIPIENT; payload: { name: string } }
  | { type: typeof REMOVE_INVOICE_RECIPIENT_EMAIL; payload: { name: string; email: string } };

export function loadInvoiceRecipientSettings() {
  return {
    type: LOAD_INVOICE_RECIPIENT_SETTINGS,
  };
}

export function loadInvoiceRecipientSettingsSuccess(recipients: InvoiceRecipient[]) {
  return {
    type: LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS,
    payload: {
      recipients
    },
  };
}

export function addInvoiceRecipient(name: string) {
  return {
    type: ADD_INVOICE_RECIPIENT,
    payload: {
      name
    }
  };
}

export function addInvoiceRecipientEmail(name: string, email: string) {
  return {
    type: ADD_INVOICE_RECIPIENT_EMAIL,
    payload: {
      name,
      email
    }
  };
}

export function removeInvoiceRecipient(name: string) {
  return {
    type: REMOVE_INVOICE_RECIPIENT,
    payload: {
      name
    }
  };
}

export function removeInvoiceRecipientEmail(name: string, email: string) {
  return {
    type: REMOVE_INVOICE_RECIPIENT_EMAIL,
    payload: {
      name,
      email
    }
  };
}
