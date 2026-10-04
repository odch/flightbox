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
jest.mock('./subpages/AdminGuestAccessPage', () => mockSubpage('guest-access'));
jest.mock('./subpages/AdminKioskAccessPage', () => mockSubpage('kiosk-access'));
jest.mock('./subpages/AdminPrivacySettingsPage', () => mockSubpage('privacy'));
jest.mock('./subpages/AdminApiAccessPage', () => mockSubpage('api-access'));

import AdminPage from './AdminPage';

const auth = {data: {admin: true}};

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
    renderWithTheme(<AdminPage auth={auth}/>);
    expect(screen.queryByRole('button', {name: /API-Zugriff/})).toBeNull();
    expect(screen.getByRole('button', {name: /Export/})).toBeInTheDocument();
  });

  it('shows the API access tab and page when reportApiEnabled is true', () => {
    (global as any).__CONF__ = {paymentMethods: {}, reportApiEnabled: true};
    renderWithTheme(<AdminPage auth={auth}/>);

    fireEvent.click(screen.getByRole('button', {name: /API-Zugriff/}));
    expect(screen.getByTestId('subpage-api-access')).toBeInTheDocument();
  });
});
