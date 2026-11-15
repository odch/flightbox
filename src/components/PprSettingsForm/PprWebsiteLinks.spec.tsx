import React from 'react';
import { renderWithTheme, screen, fireEvent, act } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../MaterialIcon', () => () => null);

import PprWebsiteLinks from './PprWebsiteLinks';

const TOKEN = '0f8fad5b-d9cb-469f-a165-70867728950e';
const LOGIN_LINK = 'https://lspl-test.web.app/ppr';
const GUEST_LINK = `https://lspl-test.web.app/#/ppr/new?t=${TOKEN}`;

// Where guests may request PPR
const CONF = { appUrl: 'https://lspl-test.web.app', ppr: true, pprGuestRequests: true, loginForm: 'email' };

const urlOf = (container: HTMLElement, dataCy: string) =>
  container.querySelector(`[data-cy="${dataCy}-url"]`) as HTMLAnchorElement | null;

describe('PprWebsiteLinks', () => {
  beforeEach(() => {
    (global as any).__CONF__ = { ...CONF };
  });

  afterEach(() => {
    delete (global as any).__CONF__;
  });

  it('offers the short link to the PPR request with the login, on the address of the app', () => {
    const { container } = renderWithTheme(<PprWebsiteLinks guestAccessToken={null}/>);

    const link = urlOf(container, 'ppr-website-link')!;
    expect(link.textContent).toBe(LOGIN_LINK);
    expect(link).toHaveAttribute('href', LOGIN_LINK);
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByText('ppr.websiteLink.login')).toBeTruthy();
    expect(screen.getByText('ppr.websiteLink.loginHelp')).toBeTruthy();
    expect(screen.getByText('ppr.websiteLink.ownView')).toBeTruthy();
  });

  it('ignores a slash at the end of the address of the app', () => {
    (global as any).__CONF__.appUrl = 'https://lspl-test.web.app/';
    const { container } = renderWithTheme(<PprWebsiteLinks guestAccessToken={TOKEN}/>);

    expect(urlOf(container, 'ppr-website-link')!.textContent).toBe(LOGIN_LINK);
    expect(urlOf(container, 'ppr-website-guest-link')!.textContent).toBe(GUEST_LINK);
  });

  it('takes the address of the page where the project sets none', () => {
    delete (global as any).__CONF__.appUrl;
    const { container } = renderWithTheme(<PprWebsiteLinks guestAccessToken={null}/>);
    expect(urlOf(container, 'ppr-website-link')!.textContent).toBe(`${window.location.origin}/ppr`);
  });

  // In the fragment like the link of the guest access: the browser sends it
  // to no server, and the login page offers the guest session with it
  it('offers the link with the guest access token where guests may request PPR', () => {
    const { container } = renderWithTheme(<PprWebsiteLinks guestAccessToken={TOKEN}/>);

    const link = urlOf(container, 'ppr-website-guest-link')!;
    expect(link.textContent).toBe(GUEST_LINK);
    expect(link).toHaveAttribute('href', GUEST_LINK);
    expect(screen.getByText('ppr.websiteLink.guest')).toBeTruthy();
    expect(screen.getByText('ppr.websiteLink.guestHelp')).toBeTruthy();
  });

  it.each([
    ['without a guest access token', {}, null],
    ['where requests without login are off', { pprGuestRequests: false }, TOKEN],
    ['where PPR is off', { ppr: false }, TOKEN],
    ['without the email login, whose page offers the guest session', { loginForm: 'usernamePassword' }, TOKEN],
  ])('offers no link with the guest access %s', (name, conf, token) => {
    (global as any).__CONF__ = { ...CONF, ...conf };
    const { container } = renderWithTheme(<PprWebsiteLinks guestAccessToken={token}/>);

    expect(urlOf(container, 'ppr-website-link')).not.toBeNull();
    expect(urlOf(container, 'ppr-website-guest-link')).toBeNull();
    expect(screen.queryByText('ppr.websiteLink.guest')).toBeNull();
  });

  it('copies a link', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderWithTheme(<PprWebsiteLinks guestAccessToken={TOKEN}/>);

    await act(async () => {
      fireEvent.click(screen.getAllByTitle('Copy to Clipboard')[1]);
    });

    expect(writeText).toHaveBeenCalledWith(GUEST_LINK);
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });

  it('shows the QR code of a link for printed notices on request', () => {
    const { container } = renderWithTheme(<PprWebsiteLinks guestAccessToken={TOKEN}/>);
    const toggle = container.querySelector('[data-cy="ppr-website-guest-link-qr-toggle"]') as HTMLButtonElement;
    expect(container.querySelector('svg')).toBeNull();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle.textContent).toBe('ppr.websiteLink.showQrCode');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle.textContent).toBe('ppr.websiteLink.hideQrCode');
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    expect(screen.getByText('common.download')).toBeTruthy();

    fireEvent.click(toggle);
    expect(container.querySelector('svg')).toBeNull();
  });
});
