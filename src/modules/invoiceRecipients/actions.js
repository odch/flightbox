export const LOAD_USER_INVOICE_RECIPIENTS = 'LOAD_USER_INVOICE_RECIPIENTS';
export const USER_INVOICE_RECIPIENTS_LOADED = 'USER_INVOICE_RECIPIENTS_LOADED';

export function loadUserInvoiceRecipients() {
  return {
    type: LOAD_USER_INVOICE_RECIPIENTS,
  };
}

export function userInvoiceRecipientsLoaded(invoiceRecipients) {
  return {
    type: USER_INVOICE_RECIPIENTS_LOADED,
    payload: {
      invoiceRecipients
    }
  };
}
