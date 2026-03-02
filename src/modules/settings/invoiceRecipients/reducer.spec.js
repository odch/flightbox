import reducer from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  loaded: false,
  recipients: [],
};

describe('modules', () => {
  describe('settings', () => {
    describe('invoiceRecipients', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {})
          ).toEqual(INITIAL_STATE);
        });

        describe('LOAD_INVOICE_RECIPIENT_SETTINGS_SUCCESS', () => {
          it('should set loaded to true and store recipients', () => {
            const recipients = [
              { name: 'Hans Meier', emails: ['hans@example.com'] },
              { name: 'Kurt Keller', emails: ['kurt@example.com'] },
            ];
            expect(
              reducer({
                loaded: false,
                recipients: [],
              }, actions.loadInvoiceRecipientSettingsSuccess(recipients))
            ).toEqual({
              loaded: true,
              recipients,
            });
          });

          it('should handle empty recipients array', () => {
            expect(
              reducer({
                loaded: false,
                recipients: [],
              }, actions.loadInvoiceRecipientSettingsSuccess([]))
            ).toEqual({
              loaded: true,
              recipients: [],
            });
          });

          it('should override existing recipients', () => {
            const oldRecipients = [{ name: 'Old', emails: [] }];
            const newRecipients = [{ name: 'New', emails: ['new@example.com'] }];
            expect(
              reducer({
                loaded: true,
                recipients: oldRecipients,
              }, actions.loadInvoiceRecipientSettingsSuccess(newRecipients))
            ).toEqual({
              loaded: true,
              recipients: newRecipients,
            });
          });
        });
      });
    });
  });
});
