import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../../test/renderWithTheme';
import { VISIT_DAYS_KEY, DISMISS_TS_KEY, DISMISS_COUNT_KEY, _resetCachedPromptForTesting } from './usePwaInstall';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

import InstallCard from './InstallCard';

const regularAuthData = { uid: 'user-123', email: 'test@example.com' };
const guestAuthData = { uid: 'guest-uid', guest: true };
const kioskAuthData = { uid: 'kiosk-uid', kiosk: true };
const ipauthData = { uid: 'ipauth', email: 'ip@a.ch' };

function setVisitDays(count: number) {
  const days: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  localStorage.setItem(VISIT_DAYS_KEY, JSON.stringify(days));
}

function mockStandalone(standalone: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: standalone && query === '(display-mode: standalone)',
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

function fireBeforeInstallPrompt() {
  const event = new Event('beforeinstallprompt');
  (event as any).prompt = jest.fn().mockResolvedValue(undefined);
  (event as any).userChoice = Promise.resolve({ outcome: 'dismissed' });
  Object.defineProperty(event, 'preventDefault', { value: jest.fn() });
  window.dispatchEvent(event);
  return event as any;
}

describe('InstallCard', () => {
  beforeEach(() => {
    localStorage.clear();
    mockStandalone(false);
    _resetCachedPromptForTesting();
    Object.defineProperty(navigator, 'standalone', {
      writable: true,
      value: false,
    });
  });

  it('does not render for guest users', () => {
    setVisitDays(5);
    fireBeforeInstallPrompt();
    renderWithTheme(<InstallCard authData={guestAuthData} />);
    expect(screen.queryByTestId('install-card')).not.toBeInTheDocument();
  });

  it('does not render for kiosk users', () => {
    setVisitDays(5);
    fireBeforeInstallPrompt();
    renderWithTheme(<InstallCard authData={kioskAuthData} />);
    expect(screen.queryByTestId('install-card')).not.toBeInTheDocument();
  });

  it('does not render for ipauth users', () => {
    setVisitDays(5);
    fireBeforeInstallPrompt();
    renderWithTheme(<InstallCard authData={ipauthData} />);
    expect(screen.queryByTestId('install-card')).not.toBeInTheDocument();
  });

  it('does not render in standalone mode', () => {
    mockStandalone(true);
    setVisitDays(5);
    renderWithTheme(<InstallCard authData={regularAuthData} />);
    expect(screen.queryByTestId('install-card')).not.toBeInTheDocument();
  });

  it('does not render with fewer than 3 visit days', () => {
    setVisitDays(2);
    fireBeforeInstallPrompt();
    renderWithTheme(<InstallCard authData={regularAuthData} />);
    expect(screen.queryByTestId('install-card')).not.toBeInTheDocument();
  });

  it('does not render when permanently dismissed', () => {
    setVisitDays(5);
    localStorage.setItem(DISMISS_COUNT_KEY, '2');
    localStorage.setItem(DISMISS_TS_KEY, String(Date.now()));
    fireBeforeInstallPrompt();
    renderWithTheme(<InstallCard authData={regularAuthData} />);
    expect(screen.queryByTestId('install-card')).not.toBeInTheDocument();
  });

  it('does not render when recently dismissed (< 90 days)', () => {
    setVisitDays(5);
    localStorage.setItem(DISMISS_COUNT_KEY, '1');
    localStorage.setItem(DISMISS_TS_KEY, String(Date.now() - 10 * 24 * 60 * 60 * 1000));
    fireBeforeInstallPrompt();
    renderWithTheme(<InstallCard authData={regularAuthData} />);
    expect(screen.queryByTestId('install-card')).not.toBeInTheDocument();
  });

  it('renders install button when beforeinstallprompt fires', () => {
    setVisitDays(5);
    fireBeforeInstallPrompt();
    renderWithTheme(<InstallCard authData={regularAuthData} />);
    expect(screen.getByTestId('install-card')).toBeInTheDocument();
    expect(screen.getByTestId('install-button')).toBeInTheDocument();
    expect(screen.getByText('pwaInstall.installButton')).toBeInTheDocument();
  });

  it('renders iOS instructions on iOS Safari UA', () => {
    setVisitDays(5);
    const originalUA = navigator.userAgent;
    const originalPlatform = navigator.platform;
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    Object.defineProperty(navigator, 'platform', {
      writable: true,
      value: 'iPhone',
    });
    renderWithTheme(<InstallCard authData={regularAuthData} />);
    expect(screen.getByTestId('ios-instructions')).toBeInTheDocument();
    expect(screen.getByTestId('share-icon')).toBeInTheDocument();

    Object.defineProperty(navigator, 'userAgent', { writable: true, value: originalUA });
    Object.defineProperty(navigator, 'platform', { writable: true, value: originalPlatform });
  });

  it('install button calls event.prompt()', () => {
    setVisitDays(5);
    const event = fireBeforeInstallPrompt();
    renderWithTheme(<InstallCard authData={regularAuthData} />);
    fireEvent.click(screen.getByTestId('install-button'));
    expect(event.prompt).toHaveBeenCalled();
  });

  it('dismiss hides card and writes localStorage', () => {
    setVisitDays(5);
    fireBeforeInstallPrompt();
    renderWithTheme(<InstallCard authData={regularAuthData} />);
    expect(screen.getByTestId('install-card')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('dismiss-link'));
    expect(screen.queryByTestId('install-card')).not.toBeInTheDocument();
    expect(localStorage.getItem(DISMISS_COUNT_KEY)).toBe('1');
    expect(localStorage.getItem(DISMISS_TS_KEY)).toBeTruthy();
  });

  it('reappears after 90 days, second dismiss is permanent', () => {
    setVisitDays(5);
    // First dismiss was 91 days ago
    localStorage.setItem(DISMISS_COUNT_KEY, '1');
    localStorage.setItem(DISMISS_TS_KEY, String(Date.now() - 91 * 24 * 60 * 60 * 1000));
    fireBeforeInstallPrompt();
    renderWithTheme(<InstallCard authData={regularAuthData} />);
    expect(screen.getByTestId('install-card')).toBeInTheDocument();

    // Second dismiss
    fireEvent.click(screen.getByTestId('dismiss-link'));
    expect(screen.queryByTestId('install-card')).not.toBeInTheDocument();
    expect(localStorage.getItem(DISMISS_COUNT_KEY)).toBe('2');
  });
});
