import React from 'react';
import '../../i18n';
import {renderWithTheme, withTheme, screen, fireEvent} from '../../../test/renderWithTheme';

jest.mock('../VerticalHeaderLayout', () => ({
  __esModule: true,
  default: ({children}: any) => <div>{children}</div>,
}));
jest.mock('../JumpNavigation', () => ({__esModule: true, default: () => null}));

// A function declaration, so it is hoisted together with the jest.mock calls.
function mockSubpage(name: string) {
  return {__esModule: true, default: () => <div data-testid={`subpage-${name}`}/>};
}
jest.mock('./subpages/AdminExportPage', () => mockSubpage('export'));
jest.mock('./subpages/AdminLockMovementsPage', () => mockSubpage('lock-movements'));
jest.mock('./subpages/AdminAerodromeStatusPage', () => mockSubpage('aerodrome-status'));
jest.mock('./subpages/AdminMessagesPage', () => mockSubpage('messages'));
jest.mock('./subpages/AdminAircraftPage', () => mockSubpage('aircraft'));
jest.mock('./subpages/AdminInvoiceRecipientsPage', () => mockSubpage('invoice-recipients'));
jest.mock('./subpages/AdminCustomsSelfDeclarationPage', () => mockSubpage('customs-self-declaration'));
jest.mock('./subpages/AdminGuestAccessPage', () => mockSubpage('guest-access'));
jest.mock('./subpages/AdminKioskAccessPage', () => mockSubpage('kiosk-access'));
jest.mock('./subpages/AdminPrivacySettingsPage', () => mockSubpage('privacy'));
jest.mock('./subpages/AdminApiAccessPage', () => mockSubpage('api-access'));
jest.mock('./subpages/AdminPprPage', () => mockSubpage('ppr'));

import AdminPage from './AdminPage';

const auth = {data: {admin: true}};

const renderAdminPage = (props: any = {}) => renderWithTheme(
  <AdminPage auth={auth} checkCustomsAvailability={jest.fn()} {...props}/>
);

// The router of renderWithTheme reads the URL of jsdom
const visit = (url: string) => window.history.replaceState(null, '', url);

describe('AdminPage', () => {
  afterEach(() => {
    delete (global as any).__CONF__;
    visit('/');
  });

  it.each([
    ['not set', {}],
    ['false', {reportApiEnabled: false}],
    ['not the boolean true', {reportApiEnabled: 'true'}],
  ])('hides the API access tab when reportApiEnabled is %s', (_, conf) => {
    (global as any).__CONF__ = {paymentMethods: {}, ...conf};
    renderAdminPage();
    expect(screen.queryByRole('button', {name: /API-Zugriff/})).toBeNull();
    expect(screen.getByRole('button', {name: /Export/})).toBeInTheDocument();
  });

  it.each([
    ['privacySettings', {privacySettings: true}],
    ['ppr (for the PPR retention)', {ppr: true}],
  ])('shows the privacy tab when %s is on', (_, conf) => {
    (global as any).__CONF__ = {paymentMethods: {}, ...conf};
    renderAdminPage();
    expect(screen.getByRole('button', {name: /Datenschutz/})).toBeInTheDocument();
  });

  describe('PPR', () => {
    it('loads all requests for the number of open ones when ppr is on', () => {
      (global as any).__CONF__ = {paymentMethods: {}, ppr: true};
      const loadPprRequests = jest.fn();
      renderAdminPage({loadPprRequests, pprPendingCount: 2});

      expect(loadPprRequests).toHaveBeenCalledWith('all');
      expect(screen.getByRole('button', {name: /PPR-Anfragen/})).toHaveTextContent('2');
    });

    it('loads no requests when ppr is off', () => {
      (global as any).__CONF__ = {paymentMethods: {}};
      const loadPprRequests = jest.fn();
      renderAdminPage({loadPprRequests});

      expect(loadPprRequests).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', {name: /PPR-Anfragen/})).toBeNull();
    });
  });

  it('hides the privacy tab when neither privacySettings nor ppr is on', () => {
    (global as any).__CONF__ = {paymentMethods: {}};
    renderAdminPage();
    expect(screen.queryByRole('button', {name: /Datenschutz/})).toBeNull();
  });

  it('shows the API access tab and page when reportApiEnabled is true', () => {
    (global as any).__CONF__ = {paymentMethods: {}, reportApiEnabled: true};
    renderAdminPage();

    fireEvent.click(screen.getByRole('button', {name: /API-Zugriff/}));
    expect(screen.getByTestId('subpage-api-access')).toBeInTheDocument();
  });

  describe('customs self-declaration', () => {
    beforeEach(() => {
      (global as any).__CONF__ = {paymentMethods: {}, customsSelfDeclarationEnabled: true};
    });

    it.each([
      ['not set', {}],
      ['false', {customsSelfDeclarationEnabled: false}],
      ['not the boolean true', {customsSelfDeclarationEnabled: 'true'}],
    ])('hides the tab and skips the customs check when customsSelfDeclarationEnabled is %s', (_, conf) => {
      (global as any).__CONF__ = {paymentMethods: {}, ...conf};
      const checkCustomsAvailability = jest.fn();
      renderAdminPage({customsAvailable: true, checkCustomsAvailability});

      expect(screen.queryByRole('button', {name: /Zoll-Selbstdeklaration/})).toBeNull();
      expect(checkCustomsAvailability).not.toHaveBeenCalled();
    });

    it('checks whether the customs integration is available on mount', () => {
      const checkCustomsAvailability = jest.fn();
      renderAdminPage({checkCustomsAvailability});

      expect(checkCustomsAvailability).toHaveBeenCalledTimes(1);
    });

    it('does not check the customs integration for non-admins', () => {
      const checkCustomsAvailability = jest.fn();
      renderAdminPage({auth: {data: {admin: false}}, checkCustomsAvailability});

      expect(checkCustomsAvailability).not.toHaveBeenCalled();
    });

    it.each([
      ['not known yet', undefined],
      ['not available', false],
    ])('hides the tab while the customs integration is %s', (_, customsAvailable) => {
      renderAdminPage({customsAvailable});

      expect(screen.queryByRole('button', {name: /Zoll-Selbstdeklaration/})).toBeNull();
      expect(screen.getByRole('button', {name: /Export/})).toBeInTheDocument();
    });

    it('shows the tab and page when the customs integration is available', () => {
      renderAdminPage({customsAvailable: true});

      fireEvent.click(screen.getByRole('button', {name: /Zoll-Selbstdeklaration/}));
      expect(screen.getByTestId('subpage-customs-self-declaration')).toBeInTheDocument();
    });
  });

  describe('tab in the URL', () => {
    it('shows the tab of the URL, e.g. of a link in the PPR notification email', () => {
      (global as any).__CONF__ = {paymentMethods: {}, ppr: true};
      visit('/admin?tab=ppr&request=-Nabc');
      renderAdminPage();

      expect(screen.getByTestId('subpage-ppr')).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /PPR-Anfragen/})).toHaveAttribute('aria-current', 'page');
      expect(window.location.search).toBe('?tab=ppr&request=-Nabc');
    });

    it('shows the export without a tab in the URL', () => {
      (global as any).__CONF__ = {paymentMethods: {}};
      visit('/admin');
      renderAdminPage();

      expect(screen.getByTestId('subpage-export')).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /Export/})).toHaveAttribute('aria-current', 'page');
    });

    it.each([
      ['an unknown tab', 'unknown'],
      ['an empty tab', ''],
      ['a key every object has', 'constructor'],
      ['a key every object has', '__proto__'],
      ['a key every object has', 'toString'],
    ])('shows the export for %s (%s)', (_, tab) => {
      (global as any).__CONF__ = {paymentMethods: {}};
      visit(`/admin?tab=${tab}`);
      renderAdminPage();

      expect(screen.getByTestId('subpage-export')).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /Export/})).toHaveAttribute('aria-current', 'page');
    });

    it.each([
      ['ppr', {}],
      ['api-access', {reportApiEnabled: false}],
      ['privacy', {}],
      ['invoice-recipients', {}],
      ['guest-access', {}],
    ])('shows the export for the hidden tab %s', (tab, conf) => {
      (global as any).__CONF__ = {paymentMethods: {}, ...conf};
      visit(`/admin?tab=${tab}`);
      renderAdminPage();

      expect(screen.getByTestId('subpage-export')).toBeInTheDocument();
      expect(screen.queryByTestId(`subpage-${tab}`)).toBeNull();
    });

    it('shows the customs self-declaration of the URL once the integration is known to be available', () => {
      (global as any).__CONF__ = {paymentMethods: {}, customsSelfDeclarationEnabled: true};
      visit('/admin?tab=customs-self-declaration');
      const {rerender} = renderAdminPage();
      expect(screen.getByTestId('subpage-export')).toBeInTheDocument();

      rerender(withTheme(<AdminPage auth={auth} checkCustomsAvailability={jest.fn()} customsAvailable/>));
      expect(screen.getByTestId('subpage-customs-self-declaration')).toBeInTheDocument();
    });

    it('puts the clicked tab in the URL, so a reload stays on it', () => {
      (global as any).__CONF__ = {paymentMethods: {}, reportApiEnabled: true};
      visit('/admin');
      renderAdminPage();

      fireEvent.click(screen.getByRole('button', {name: /API-Zugriff/}));

      expect(window.location.pathname).toBe('/admin');
      expect(window.location.search).toBe('?tab=api-access');
      expect(screen.getByTestId('subpage-api-access')).toBeInTheDocument();
      expect(screen.getByRole('button', {name: /API-Zugriff/})).toHaveAttribute('aria-current', 'page');
    });

    it('drops the request of a PPR link when another tab is clicked', () => {
      (global as any).__CONF__ = {paymentMethods: {}, ppr: true};
      visit('/admin?tab=ppr&request=-Nabc');
      renderAdminPage();

      fireEvent.click(screen.getByRole('button', {name: /Export/}));

      expect(window.location.search).toBe('?tab=export');
      expect(screen.getByTestId('subpage-export')).toBeInTheDocument();
    });

    it('adds an entry to the history for another tab only, not for the tab shown', () => {
      (global as any).__CONF__ = {paymentMethods: {}, ppr: true};
      visit('/admin?tab=ppr&request=-Nabc');
      renderAdminPage();
      const entries = window.history.length;

      fireEvent.click(screen.getByRole('button', {name: /PPR/}));
      expect(window.location.search).toBe('?tab=ppr');
      expect(screen.getByTestId('subpage-ppr')).toBeInTheDocument();
      expect(window.history.length).toBe(entries);

      fireEvent.click(screen.getByRole('button', {name: /Export/}));
      expect(window.location.search).toBe('?tab=export');
      expect(window.history.length).toBe(entries + 1);
    });
  });
});
