import {call, select, take} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import firebase from '../../../util/firebase';
import {set} from 'firebase/database';

jest.mock('../../../util/firebase');
jest.mock('firebase/database', () => ({
  onValue: jest.fn(),
  set: jest.fn(),
}));

describe('modules', () => {
  describe('settings', () => {
    describe('invoiceRecipients', () => {
      describe('sagas', () => {
        describe('invoiceRecipientsSelector', () => {
          it('should select recipients from state', () => {
            const recipients = [{name: 'Recipient A'}];
            const state = {
              settings: {
                invoiceRecipients: {
                  recipients
                }
              }
            };
            expect(sagas.invoiceRecipientsSelector(state)).toEqual(recipients);
          });
        });

        describe('watchLoadRecipients', () => {
          it('should wait for load action and call loadRecipients', () => {
            const channel = {put: jest.fn()};
            const generator = sagas.watchLoadRecipients(channel);

            expect(generator.next().value).toEqual(take(actions.LOAD_INVOICE_RECIPIENT_SETTINGS));
            expect(generator.next().value).toEqual(call(sagas.loadRecipients, channel));
            expect(generator.next().done).toEqual(true);
          });
        });

        describe('addInvoiceRecipient', () => {
          it('should add a new recipient and save', () => {
            const action = actions.addInvoiceRecipient('New Recipient');
            const generator = sagas.addInvoiceRecipient(action);

            expect(generator.next().value).toEqual(select(sagas.invoiceRecipientsSelector));

            const currentRecipients = [{name: 'Existing Recipient'}];
            const expectedRecipients = [
              {name: 'Existing Recipient'},
              {name: 'New Recipient'}
            ];

            expect(generator.next(currentRecipients).value).toEqual(
              call(sagas.saveInvoiceRecipients, expectedRecipients)
            );

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('addInvoiceRecipientEmail', () => {
          it('should add email to recipient with existing emails', () => {
            const action = actions.addInvoiceRecipientEmail('Recipient A', 'new@example.com');
            const generator = sagas.addInvoiceRecipientEmail(action);

            expect(generator.next().value).toEqual(select(sagas.invoiceRecipientsSelector));

            const currentRecipients = [
              {name: 'Recipient A', emails: ['existing@example.com']},
              {name: 'Recipient B'}
            ];
            const expectedRecipients = [
              {name: 'Recipient A', emails: ['existing@example.com', 'new@example.com']},
              {name: 'Recipient B'}
            ];

            expect(generator.next(currentRecipients).value).toEqual(
              call(sagas.saveInvoiceRecipients, expectedRecipients)
            );

            expect(generator.next().done).toEqual(true);
          });

          it('should add email to recipient without existing emails', () => {
            const action = actions.addInvoiceRecipientEmail('Recipient A', 'first@example.com');
            const generator = sagas.addInvoiceRecipientEmail(action);

            expect(generator.next().value).toEqual(select(sagas.invoiceRecipientsSelector));

            const currentRecipients = [
              {name: 'Recipient A'}
            ];
            const expectedRecipients = [
              {name: 'Recipient A', emails: ['first@example.com']}
            ];

            expect(generator.next(currentRecipients).value).toEqual(
              call(sagas.saveInvoiceRecipients, expectedRecipients)
            );

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('removeInvoiceRecipient', () => {
          it('should remove a recipient by name and save', () => {
            const action = actions.removeInvoiceRecipient('Recipient A');
            const generator = sagas.removeInvoiceRecipient(action);

            expect(generator.next().value).toEqual(select(sagas.invoiceRecipientsSelector));

            const currentRecipients = [
              {name: 'Recipient A'},
              {name: 'Recipient B'}
            ];
            const expectedRecipients = [{name: 'Recipient B'}];

            expect(generator.next(currentRecipients).value).toEqual(
              call(sagas.saveInvoiceRecipients, expectedRecipients)
            );

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('removeInvoiceRecipientEmail', () => {
          it('should remove an email from recipient and save', () => {
            const action = actions.removeInvoiceRecipientEmail('Recipient A', 'remove@example.com');
            const generator = sagas.removeInvoiceRecipientEmail(action);

            expect(generator.next().value).toEqual(select(sagas.invoiceRecipientsSelector));

            const currentRecipients = [
              {name: 'Recipient A', emails: ['keep@example.com', 'remove@example.com']},
              {name: 'Recipient B', emails: ['other@example.com']}
            ];
            const expectedRecipients = [
              {name: 'Recipient A', emails: ['keep@example.com']},
              {name: 'Recipient B', emails: ['other@example.com']}
            ];

            expect(generator.next(currentRecipients).value).toEqual(
              call(sagas.saveInvoiceRecipients, expectedRecipients)
            );

            expect(generator.next().done).toEqual(true);
          });
        });

        describe('saveInvoiceRecipients', () => {
          it('should call set with recipients', async () => {
            const mockRef = {};
            (firebase as jest.Mock).mockReturnValue(mockRef);
            (set as jest.Mock).mockResolvedValue(undefined);

            await sagas.saveInvoiceRecipients([{name: 'Recipient A'}]);

            expect(firebase).toHaveBeenCalledWith('/settings/invoiceRecipients');
            expect(set).toHaveBeenCalledWith(mockRef, [{name: 'Recipient A'}]);
          });
        });
      });
    });
  });
});
