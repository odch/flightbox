import React from 'react';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter } from 'react-router-dom';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';
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

  it('auto-dismisses after a successful registration (submitting true → false, no failure)', () => {
    const { container, rerender } = renderWithTheme(
      <PostLoginPasskeyPrompt {...baseProps} submitting={true} />
    );
    expect(container.firstChild).not.toBeNull();
    rerender(withWrappers(<PostLoginPasskeyPrompt {...baseProps} submitting={false} failure={false} />));
    expect(container.firstChild).toBeNull();
    expect(window.localStorage.getItem('passkeyPromptDismissCount')).toBe('1');
  });

  it('stays visible when registration fails', () => {
    const { container, rerender } = renderWithTheme(
      <PostLoginPasskeyPrompt {...baseProps} submitting={true} />
    );
    rerender(withWrappers(<PostLoginPasskeyPrompt {...baseProps} submitting={false} failure={true} />));
    expect(container.firstChild).not.toBeNull();
  });
});
