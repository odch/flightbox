export const LOAD_USER_INVOICE_RECIPIENTS = 'LOAD_USER_INVOICE_RECIPIENTS' as const;
export const USER_INVOICE_RECIPIENTS_LOADED = 'USER_INVOICE_RECIPIENTS_LOADED' as const;

export type InvoiceRecipientsAction =
  | { type: typeof LOAD_USER_INVOICE_RECIPIENTS }
  | { type: typeof USER_INVOICE_RECIPIENTS_LOADED; payload: { invoiceRecipients: unknown[] } };

export function loadUserInvoiceRecipients() {
  return {
    type: LOAD_USER_INVOICE_RECIPIENTS,
  };
}

export function userInvoiceRecipientsLoaded(invoiceRecipients: unknown[]) {
  return {
    type: USER_INVOICE_RECIPIENTS_LOADED,
    payload: {
      invoiceRecipients
    }
  };
}
