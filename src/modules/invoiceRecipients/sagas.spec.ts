import {call, put} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import {getIdToken} from '../../util/firebase';

jest.mock('../../util/firebase');

describe('modules', () => {
  describe('invoiceRecipients', () => {
    describe('sagas', () => {
      beforeEach(() => {
        global.__FIREBASE_PROJECT_ID__ = 'test-project';
        global.fetch = jest.fn();
      });

      describe('loadUserInvoiceRecipients', () => {
        it('should load invoice recipients and put userInvoiceRecipientsLoaded', () => {
          const generator = sagas.loadUserInvoiceRecipients();

          expect(generator.next().value).toEqual(call(getIdToken));

          const idToken = 'test-token';
          const url = 'https://europe-west1-test-project.cloudfunctions.net/api/users/me/invoice-recipients';
          expect(generator.next(idToken).value).toEqual(
            call(fetch, url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            })
          );

          const response = { ok: true } as any;
          expect(generator.next(response).value).toEqual(call([response, response.json]));

          const invoiceRecipients = [{ id: '1', name: 'Test Recipient' }];
          expect(generator.next(invoiceRecipients).value).toEqual(
            put(actions.userInvoiceRecipientsLoaded(invoiceRecipients))
          );

          expect(generator.next().done).toEqual(true);
        });

        it('should handle error silently when response is not ok', () => {
          const generator = sagas.loadUserInvoiceRecipients();

          expect(generator.next().value).toEqual(call(getIdToken));

          const idToken = 'test-token';
          const url = 'https://europe-west1-test-project.cloudfunctions.net/api/users/me/invoice-recipients';
          expect(generator.next(idToken).value).toEqual(
            call(fetch, url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            })
          );

          const response = { ok: false, status: 403, statusText: 'Forbidden' };
          expect(generator.next(response).done).toEqual(true);
        });

        it('should handle error silently when fetch throws', () => {
          const generator = sagas.loadUserInvoiceRecipients();

          expect(generator.next().value).toEqual(call(getIdToken));

          const error = new Error('Network error');
          expect(generator.throw(error).done).toEqual(true);
        });
      });
    });
  });
});
