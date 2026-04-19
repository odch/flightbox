import React from 'react';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter } from 'react-router-dom';
import { act, renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';
import PostLoginPasskeyPrompt from './PostLoginPasskeyPrompt';

const theme = { colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' }, images: { logo: '' } };
const withWrappers = (el: React.ReactElement) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>{el}</ThemeProvider>
  </BrowserRouter>
);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../MaterialIcon', () => {
  const ReactLocal = require('react');
  return function MockMaterialIcon({ icon }: { icon: string }) {
    return ReactLocal.createElement('span', { 'data-testid': `icon-${icon}` });
  };
});

describe('PostLoginPasskeyPrompt', () => {
  const baseProps = {
    show: true,
    submitting: false,
    failure: false,
    loadPasskeys: jest.fn(),
    registerPasskey: jest.fn(),
  };

  beforeEach(() => {
    (window as any).PublicKeyCredential = function () {};
    window.localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (window as any).PublicKeyCredential;
    window.localStorage.clear();
  });

  it('renders nothing when show is false', () => {
    const { container } = renderWithTheme(
      <PostLoginPasskeyPrompt {...baseProps} show={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when PublicKeyCredential is unavailable', () => {
    delete (window as any).PublicKeyCredential;
    const { container } = renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when permanently dismissed (count >= 2)', () => {
    window.localStorage.setItem('passkeyPromptDismissCount', '2');
    const { container } = renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when dismissed once within the TTL window', () => {
    window.localStorage.setItem('passkeyPromptDismissCount', '1');
    window.localStorage.setItem('passkeyPromptDismissedAt', String(Date.now()));
    const { container } = renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders again after the TTL window elapses (count === 1, old timestamp)', () => {
    window.localStorage.setItem('passkeyPromptDismissCount', '1');
    const longAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    window.localStorage.setItem('passkeyPromptDismissedAt', String(longAgo));
    renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} />);
    expect(screen.getByText('profile.passkeyPromptTitle')).toBeInTheDocument();
  });

  it('renders title, description, register button and dismiss link', () => {
    renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} />);
    expect(screen.getByText('profile.passkeyPromptTitle')).toBeInTheDocument();
    expect(screen.getByText('profile.passkeyPromptDescription')).toBeInTheDocument();
    expect(screen.getByText('profile.passkeyPromptRegister')).toBeInTheDocument();
    expect(screen.getByText('profile.passkeyPromptDismiss')).toBeInTheDocument();
  });

  it('shows the "dismiss permanent" label after one prior dismissal', () => {
    window.localStorage.setItem('passkeyPromptDismissCount', '1');
    const longAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    window.localStorage.setItem('passkeyPromptDismissedAt', String(longAgo));
    renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} />);
    expect(screen.getByText('profile.passkeyPromptDismissPermanent')).toBeInTheDocument();
    expect(screen.queryByText('profile.passkeyPromptDismiss')).not.toBeInTheDocument();
  });

  it('calls loadPasskeys on mount when show is true', () => {
    const loadPasskeys = jest.fn();
    renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} loadPasskeys={loadPasskeys} />);
    expect(loadPasskeys).toHaveBeenCalled();
  });

  it('does not call loadPasskeys when show is false', () => {
    const loadPasskeys = jest.fn();
    renderWithTheme(
      <PostLoginPasskeyPrompt {...baseProps} show={false} loadPasskeys={loadPasskeys} />
    );
    expect(loadPasskeys).not.toHaveBeenCalled();
  });

  it('calls registerPasskey when register button is clicked', () => {
    const registerPasskey = jest.fn();
    renderWithTheme(
      <PostLoginPasskeyPrompt {...baseProps} registerPasskey={registerPasskey} />
    );
    fireEvent.click(screen.getByText('profile.passkeyPromptRegister'));
    expect(registerPasskey).toHaveBeenCalled();
  });

  it('increments dismiss count, persists timestamp, and hides on dismiss click', () => {
    const { container } = renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} />);
    fireEvent.click(screen.getByText('profile.passkeyPromptDismiss'));
    expect(container.firstChild).toBeNull();
    expect(window.localStorage.getItem('passkeyPromptDismissCount')).toBe('1');
    expect(window.localStorage.getItem('passkeyPromptDismissedAt')).toBeTruthy();
  });

  it('marks as permanently dismissed on second dismiss click', () => {
    window.localStorage.setItem('passkeyPromptDismissCount', '1');
    const longAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    window.localStorage.setItem('passkeyPromptDismissedAt', String(longAgo));
    renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} />);
    fireEvent.click(screen.getByText('profile.passkeyPromptDismissPermanent'));
    expect(window.localStorage.getItem('passkeyPromptDismissCount')).toBe('2');
  });

  it('shows the loading spinner and disables the button while submitting', () => {
    renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} submitting />);
    expect(screen.getByTestId('icon-sync')).toBeInTheDocument();
    const btn = screen.getByText('profile.passkeyPromptRegister').closest('button') as HTMLButtonElement;
    expect(btn).toBeDisabled();
  });

  it('shows the success card after registration succeeds, then auto-dismisses', () => {
    jest.useFakeTimers();
    const { container, rerender } = renderWithTheme(
      <PostLoginPasskeyPrompt {...baseProps} submitting />
    );
    rerender(withWrappers(<PostLoginPasskeyPrompt {...baseProps} submitting={false} failure={false} />));

    expect(screen.getByText('profile.passkeyPromptSuccessTitle')).toBeInTheDocument();
    expect(screen.getByText('profile.passkeyPromptSuccessDescription')).toBeInTheDocument();
    expect(screen.queryByText('profile.passkeyPromptRegister')).not.toBeInTheDocument();
    // The persistent dismiss counter must NOT be bumped on successful
    // registration — otherwise the tile can't return after the user removes
    // all their passkeys.
    expect(window.localStorage.getItem('passkeyPromptDismissCount')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(container.firstChild).toBeNull();
    jest.useRealTimers();
  });

  it('keeps showing the success card after show drops to false (loadPasskeys race)', () => {
    jest.useFakeTimers();
    const { container, rerender } = renderWithTheme(
      <PostLoginPasskeyPrompt {...baseProps} submitting />
    );
    // Simulate the real flow: registerPasskeySuccess AND loadPasskeys both
    // land in the same redux dispatch pair — submitting goes false, and
    // the newly-loaded passkey list makes the container flip show to false.
    rerender(withWrappers(
      <PostLoginPasskeyPrompt {...baseProps} submitting={false} failure={false} show={false} />
    ));
    expect(screen.getByText('profile.passkeyPromptSuccessTitle')).toBeInTheDocument();
    expect(screen.getByText('profile.passkeyPromptSuccessDescription')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3500);
    });
    expect(container.firstChild).toBeNull();
    jest.useRealTimers();
  });

  it('shows an error notice when registration fails, stays visible', () => {
    const { container, rerender } = renderWithTheme(
      <PostLoginPasskeyPrompt {...baseProps} submitting />
    );
    rerender(withWrappers(<PostLoginPasskeyPrompt {...baseProps} submitting={false} failure />));
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('profile.passkeysRegistrationFailure')).toBeInTheDocument();
    expect(screen.queryByText('profile.passkeyPromptSuccessTitle')).not.toBeInTheDocument();
  });

  it('does not show error notice when idle', () => {
    renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} />);
    expect(screen.queryByText('profile.passkeysRegistrationFailure')).not.toBeInTheDocument();
  });

  it('reappears on a fresh mount after a successful registration then passkey removal', () => {
    jest.useFakeTimers();
    // User registers a passkey from the tile.
    const first = renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} submitting />);
    first.rerender(withWrappers(
      <PostLoginPasskeyPrompt {...baseProps} submitting={false} show={false} />
    ));
    act(() => { jest.advanceTimersByTime(3500); });
    jest.useRealTimers();
    first.unmount();

    // The persistent dismiss counter must remain empty so the tile can
    // return after the user removes all their passkeys and revisits.
    expect(window.localStorage.getItem('passkeyPromptDismissCount')).toBeNull();

    // User removes all passkeys; the container flips show back to true on
    // the next visit (fresh mount).
    renderWithTheme(<PostLoginPasskeyPrompt {...baseProps} submitting={false} show={true} />);
    expect(screen.getByText('profile.passkeyPromptTitle')).toBeInTheDocument();
    expect(screen.getByText('profile.passkeyPromptRegister')).toBeInTheDocument();
  });
});
