import React from 'react';
import '../../../i18n';
import {renderWithTheme, screen} from '../../../../test/renderWithTheme';

jest.mock('../../../containers/CustomsSyncStatusContainer', () => ({
  __esModule: true,
  default: ({statusKey}: any) => <div data-testid="customs-sync-status">{statusKey}</div>,
}));
jest.mock('../../../containers/CustomsSelfDeclarationEmailListContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="self-declaration-email-list"/>,
}));

import AdminCustomsSelfDeclarationPage from './AdminCustomsSelfDeclarationPage';

describe('AdminCustomsSelfDeclarationPage', () => {
  it('describes the self-declaration and its aircraft condition and shows the sync status and the list', () => {
    renderWithTheme(<AdminCustomsSelfDeclarationPage/>);

    expect(screen.getByText('Zoll-Selbstdeklaration')).toBeInTheDocument();
    expect(screen.getByText(/direkt an die Zollbehörden übermittelt werden \(Selbstdeklaration\)/)).toBeInTheDocument();
    expect(screen.getByText(/nur, wenn ihre Immatrikulation einem der Luftfahrzeuge der Person entspricht/)).toBeInTheDocument();
    expect(screen.getByTestId('customs-sync-status')).toHaveTextContent('selfDeclarationEmails');
    expect(screen.getByTestId('self-declaration-email-list')).toBeInTheDocument();
  });
});
