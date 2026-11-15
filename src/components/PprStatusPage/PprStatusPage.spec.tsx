import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { unstable_HistoryRouter as HistoryRouter, Route, Routes } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { ThemeProvider } from 'styled-components';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: object) => options ? `${key}:${JSON.stringify(options)}` : key }),
}));

jest.mock('../MaterialIcon', () => () => null);

jest.mock('../VerticalHeaderLayout', () => {
  const React = require('react');
  return function MockLayout({ children, homePath }) {
    return <div data-testid="layout" data-home-path={homePath}>{children}</div>;
  };
});

jest.mock('../JumpNavigation', () => {
  const React = require('react');
  return function MockJumpNav() {
    return <nav data-testid="jump-nav"/>;
  };
});

jest.mock('../ModalDialog', () => {
  const React = require('react');
  return function MockModalDialog({ content }) {
    return <div data-testid="modal-dialog">{content}</div>;
  };
});

import PprStatusPage from './PprStatusPage';

const theme: any = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};

const TOKEN = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJ-_0123';

const pending = {
  status: 'pending',
  immatriculation: 'HBKOF',
  plannedDate: '2026-11-20',
  plannedTime: '10:30',
  flightType: 'private',
  automatic: false,
  canWithdraw: true,
};

const defaultProps = {
  request: null,
  loading: false,
  withdrawing: false,
  notice: null,
  visitor: true,
  canRequest: true,
};

const renderPage = (props: object = {}, path = `/ppr/status/-Nabc/${TOKEN}`) => {
  const history = createMemoryHistory({ initialEntries: [path] });
  const actions = {
    loadPprStatus: jest.fn(),
    withdrawPprRequest: jest.fn(),
    resetPprStatus: jest.fn(),
  };
  const page = (pageProps: object) => (
    <ThemeProvider theme={theme}>
      <HistoryRouter history={history as any}>
        <Routes>
          <Route path="/ppr/status/:key/:token" element={<PprStatusPage {...defaultProps} {...actions} {...pageProps}/>}/>
          <Route path="*" element={<div>elsewhere</div>}/>
        </Routes>
      </HistoryRouter>
    </ThemeProvider>
  );
  const utils = render(page(props));
  return { ...utils, history, actions, rerenderWith: (pageProps: object) => utils.rerender(page(pageProps)) };
};

describe('PprStatusPage', () => {
  beforeEach(() => {
    (global as any).__CONF__ = { aerodrome: { name: 'Langenthal' } };
  });

  afterEach(() => {
    delete (global as any).__CONF__;
  });

  it('names the aerodrome in the heading, as the side header is hidden on phones', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('ppr.requestFor:{"aerodrome":"Langenthal"}');
  });

  it('loads the request of the link, and forgets it when left', () => {
    const { actions, history } = renderPage();
    expect(actions.loadPprStatus).toHaveBeenCalledWith('-Nabc', TOKEN);
    expect(actions.resetPprStatus).not.toHaveBeenCalled();

    act(() => {
      history.push('/');
    });

    expect(actions.resetPprStatus).toHaveBeenCalledTimes(1);
  });

  it('loads the request of another link opened on the page', () => {
    const { actions, history } = renderPage();

    act(() => {
      history.push(`/ppr/status/-Ndef/${TOKEN}`);
    });

    expect(actions.resetPprStatus).toHaveBeenCalledTimes(1);
    expect(actions.loadPprStatus).toHaveBeenLastCalledWith('-Ndef', TOKEN);
  });

  it('shows that the request is loading', () => {
    renderPage({ loading: true });
    expect(screen.getByText('common.loading')).toBeTruthy();
  });

  it('shows the request without personal data, and that it is not answered yet', () => {
    const { container } = renderPage({ request: pending });

    const request = within(container.querySelector('[data-cy="ppr-status-request"]') as HTMLElement);
    expect(request.getByText('HBKOF')).toBeTruthy();
    expect(request.getByText('20.11.2026')).toBeTruthy();
    expect(request.getByText('10:30')).toBeTruthy();
    expect(request.getByText('flightTypes.private')).toBeTruthy();
    expect(request.getByText('ppr.status.pending')).toBeTruthy();
    expect(request.getByText('ppr.statusPage.pendingHint')).toBeTruthy();
  });

  it('shows the answer of an approval, with the hint to check before the flight', () => {
    renderPage({
      request: { ...pending, status: 'approved', reviewRemarks: 'Runway 05/23', automatic: true, canWithdraw: false },
    });

    expect(screen.getByText('ppr.status.approved')).toBeTruthy();
    expect(screen.getByText('Runway 05/23', { exact: false })).toHaveTextContent('ppr.pilotInfoRunway 05/23');
    expect(screen.getByText('ppr.checkBeforeFlight')).toBeTruthy();
    expect(screen.queryByText('ppr.statusPage.pendingHint')).toBeNull();
    expect(screen.queryByText('ppr.statusPage.withdraw')).toBeNull();
  });

  it('shows the remark of an approval by an admin as such, as the email does', () => {
    renderPage({ request: { ...pending, status: 'approved', reviewRemarks: 'Nur Piste 36', canWithdraw: false } });

    expect(screen.getByText('Nur Piste 36', { exact: false })).toHaveTextContent('ppr.approvalRemarksNur Piste 36');
  });

  it.each(['rejected', 'revoked'])('shows the reason of a %s request', status => {
    renderPage({ request: { ...pending, status, reviewRemarks: 'Runway works', canWithdraw: false } });

    expect(screen.getByText('Runway works', { exact: false })).toHaveTextContent('ppr.reasonRunway works');
    expect(screen.queryByText('ppr.checkBeforeFlight')).toBeNull();
  });

  describe('withdrawing', () => {
    it('withdraws the request after a confirmation', () => {
      const { actions } = renderPage({ request: pending });

      fireEvent.click(screen.getByText('ppr.statusPage.withdraw'));
      const dialog = within(screen.getByTestId('modal-dialog'));
      expect(dialog.getByText('ppr.statusPage.withdrawConfirm')).toBeTruthy();
      expect(actions.withdrawPprRequest).not.toHaveBeenCalled();

      fireEvent.click(dialog.getByText('ppr.statusPage.withdraw'));

      expect(actions.withdrawPprRequest).toHaveBeenCalledWith('-Nabc', TOKEN);
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });

    it('can be cancelled', () => {
      const { actions } = renderPage({ request: pending });

      fireEvent.click(screen.getByText('ppr.statusPage.withdraw'));
      fireEvent.click(within(screen.getByTestId('modal-dialog')).getByText('common.cancel'));

      expect(actions.withdrawPprRequest).not.toHaveBeenCalled();
      expect(screen.queryByTestId('modal-dialog')).toBeNull();
    });

    it('is offered only where the server allows it', () => {
      renderPage({ request: { ...pending, canWithdraw: false } });
      expect(screen.queryByText('ppr.statusPage.withdraw')).toBeNull();
    });

    it('is not offered again while it is sent', () => {
      renderPage({ request: pending, withdrawing: true });
      expect(screen.getByText('ppr.statusPage.withdraw').closest('button')).toHaveAttribute('disabled');
    });
  });

  describe('notices', () => {
    it.each([
      ['withdrawn', 'ppr.statusPage.withdrawn'],
      ['notFound', 'ppr.statusPage.notFound'],
      ['answeredMeanwhile', 'ppr.statusPage.answeredMeanwhile'],
    ])('tells that the request was %s', (notice, text) => {
      renderPage({ notice });
      expect(screen.getByRole('status')).toHaveTextContent(text);
    });

    it.each([
      ['loadFailed', 'ppr.statusPage.loadFailed'],
      ['withdrawFailed', 'ppr.statusPage.withdrawFailed'],
    ])('alerts to the failure %s', (notice, text) => {
      renderPage({ notice });
      expect(screen.getByRole('alert')).toHaveTextContent(text);
    });

    it('shows the answer below the notice that it came in the meantime', () => {
      renderPage({ notice: 'answeredMeanwhile', request: { ...pending, status: 'approved', canWithdraw: false } });

      expect(screen.getByRole('status')).toHaveTextContent('ppr.statusPage.answeredMeanwhile');
      expect(screen.getByText('ppr.status.approved')).toBeTruthy();
    });

    it('tells nothing without a notice', () => {
      renderPage({ request: pending });
      expect(screen.queryByRole('status')).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    // Live regions don't announce a notice shown with its text
    it.each([
      ['withdrawn', 'status'],
      ['answeredMeanwhile', 'status'],
      ['withdrawFailed', 'alert'],
    ])('moves the focus to the notice %s after the withdrawal', (notice, role) => {
      const { rerenderWith } = renderPage({ request: pending, withdrawing: true });
      expect(document.activeElement).toBe(document.body);

      rerenderWith({ request: notice === 'withdrawn' ? null : pending, notice });

      expect(document.activeElement).toBe(screen.getByRole(role));
    });

    it('leaves the focus where it was moved in the meantime', () => {
      const { rerenderWith } = renderPage({ request: pending, withdrawing: true });
      const link = screen.getByText('ppr.newRequest').closest('a') as HTMLAnchorElement;
      link.focus();

      rerenderWith({ request: null, notice: 'withdrawn' });

      expect(document.activeElement).toBe(link);
    });
  });

  describe('new request', () => {
    it.each([
      ['after a withdrawal', { notice: 'withdrawn' }],
      ['where the link leads nowhere', { notice: 'notFound' }],
      ['with a request', { request: pending }],
    ])('is offered %s', (name, props) => {
      renderPage(props);

      const link = screen.getByText('ppr.newRequest').closest('a') as HTMLAnchorElement;
      fireEvent.click(link);

      expect(screen.getByText('elsewhere')).toBeTruthy();
    });

    it('leads to the PPR form, or the intro for visitors', () => {
      renderPage({ notice: 'withdrawn' });
      expect(screen.getByText('ppr.newRequest').closest('a')).toHaveAttribute('href', '/ppr/new');
    });

    it('is not offered while the request loads', () => {
      renderPage({ loading: true });
      expect(screen.queryByText('ppr.newRequest')).toBeNull();
    });

    it('is not offered to sessions that cannot request PPR', () => {
      renderPage({ notice: 'withdrawn', canRequest: false, visitor: false });
      expect(screen.queryByText('ppr.newRequest')).toBeNull();
    });
  });

  describe('navigation', () => {
    it('shows visitors no navigation to pages behind the login, and the PPR intro behind the logo', () => {
      renderPage({ visitor: true });

      expect(screen.queryByTestId('jump-nav')).toBeNull();
      expect(screen.getByTestId('layout')).toHaveAttribute('data-home-path', '/ppr/new');
    });

    it('shows logins the navigation, and the start page behind the logo', () => {
      renderPage({ visitor: false });

      expect(screen.getByTestId('jump-nav')).toBeTruthy();
      expect(screen.getByTestId('layout')).not.toHaveAttribute('data-home-path');
    });
  });
});
