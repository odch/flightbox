import React from 'react';
import '../../../i18n';
import {renderWithTheme, screen} from '../../../../test/renderWithTheme';

jest.mock('../../../containers/CustomsSyncStatusContainer', () => ({
  __esModule: true,
  default: ({statusKey}: any) => <div data-testid="customs-sync-status">{statusKey}</div>,
}));
jest.mock('../../../containers/InvoiceRecipientsListContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="invoice-recipients-list"/>,
}));

import AdminInvoiceRecipientsPage from './AdminInvoiceRecipientsPage';

describe('AdminInvoiceRecipientsPage', () => {
  afterEach(() => {
    delete (global as any).__CONF__;
  });

  it('shows the customs sync status of the invoice recipients and the list', () => {
    (global as any).__CONF__ = {paymentMethods: ['invoice']};
    renderWithTheme(<AdminInvoiceRecipientsPage/>);

    expect(screen.getByTestId('customs-sync-status')).toHaveTextContent('invoiceRecipients');
    expect(screen.getByTestId('invoice-recipients-list')).toBeInTheDocument();
  });

  it('shows only a note when invoices are not enabled', () => {
    (global as any).__CONF__ = {paymentMethods: ['card']};
    renderWithTheme(<AdminInvoiceRecipientsPage/>);

    expect(screen.getByText('Rechnungsfunktion ist nicht aktiviert.')).toBeInTheDocument();
    expect(screen.queryByTestId('customs-sync-status')).toBeNull();
  });
});
