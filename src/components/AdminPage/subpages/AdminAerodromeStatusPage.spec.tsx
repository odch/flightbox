import React from 'react';
import '../../../i18n';
import {renderWithTheme, screen} from '../../../../test/renderWithTheme';

jest.mock('../../../containers/AerodromeStatusFormContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="aerodrome-status-form"/>,
}));
jest.mock('../../AerodromeStatusBannerToggle', () => ({
  __esModule: true,
  default: () => <div data-testid="aerodrome-status-banner-toggle"/>,
}));

import AdminAerodromeStatusPage from './AdminAerodromeStatusPage';

const pprHint = /Solange der Status «Geschlossen» ist, werden PPR-Anfragen für heute abgelehnt/;

describe('AdminAerodromeStatusPage', () => {
  afterEach(() => {
    delete (global as any).__CONF__;
  });

  it('shows the banner toggle and the status form', () => {
    (global as any).__CONF__ = {};
    renderWithTheme(<AdminAerodromeStatusPage/>);

    expect(screen.getByText('Flugplatz-Status')).toBeInTheDocument();
    expect(screen.getByTestId('aerodrome-status-banner-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('aerodrome-status-form')).toBeInTheDocument();
  });

  it('points out below the form what the status means for PPR requests when ppr is on', () => {
    (global as any).__CONF__ = {ppr: true};
    renderWithTheme(<AdminAerodromeStatusPage/>);

    const hint = screen.getByText(pprHint);
    expect(hint).toHaveTextContent('im Tab «PPR-Anfragen» unter «Gesperrte Tage»');
    expect(screen.getByTestId('aerodrome-status-form').compareDocumentPosition(hint))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it.each([
    ['not set', {}],
    ['false', {ppr: false}],
    ['not the boolean true', {ppr: 'true'}],
  ])('has no PPR hint when ppr is %s', (_, conf) => {
    (global as any).__CONF__ = conf;
    renderWithTheme(<AdminAerodromeStatusPage/>);

    expect(screen.queryByText(pprHint)).toBeNull();
  });
});
