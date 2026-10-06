import React from 'react';
import '../../i18n';
import {renderWithTheme, screen, fireEvent} from '../../../test/renderWithTheme';

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

import AdminPage from './AdminPage';

const auth = {data: {admin: true}};

const renderAdminPage = (props: any = {}) => renderWithTheme(
  <AdminPage auth={auth} checkCustomsAvailability={jest.fn()} {...props}/>
);

describe('AdminPage', () => {
  afterEach(() => {
    delete (global as any).__CONF__;
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
});
