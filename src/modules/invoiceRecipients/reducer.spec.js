import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  recipients: undefined,
};

describe('modules', () => {
  describe('invoiceRecipients', () => {
    describe('reducer', () => {
      it('should handle initial state', () => {
        expect(
          reducer(undefined, {})
        ).toEqual(INITIAL_STATE);
      });

      describe('USER_INVOICE_RECIPIENTS_LOADED', () => {
        it('should set recipients', () => {
          const recipients = [
            { name: 'Hans Meier', email: 'hans@example.com' },
            { name: 'Kurt Keller', email: 'kurt@example.com' },
          ];
          expect(
            reducer({
              recipients: undefined,
            }, actions.userInvoiceRecipientsLoaded(recipients))
          ).toEqual({
            recipients,
          });
        });

        it('should override existing recipients', () => {
          const oldRecipients = [
            { name: 'Old Recipient', email: 'old@example.com' },
          ];
          const newRecipients = [
            { name: 'New Recipient', email: 'new@example.com' },
          ];
          expect(
            reducer({
              recipients: oldRecipients,
            }, actions.userInvoiceRecipientsLoaded(newRecipients))
          ).toEqual({
            recipients: newRecipients,
          });
        });

        it('should handle empty recipients array', () => {
          expect(
            reducer({
              recipients: [{ name: 'Hans Meier', email: 'hans@example.com' }],
            }, actions.userInvoiceRecipientsLoaded([]))
          ).toEqual({
            recipients: [],
          });
        });
      });
    });
  });
});
