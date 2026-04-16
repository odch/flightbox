import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';
import PasskeyLoginButton from './PasskeyLoginButton';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({ icon }: { icon: string }) {
    return <span data-testid={`icon-${icon}`} />;
  };
});

describe('PasskeyLoginButton', () => {
  const baseProps = {
    submitting: false,
    failure: false,
    loginWithPasskey: jest.fn(),
  };

  beforeEach(() => {
    (window as any).PublicKeyCredential = function () {};
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (window as any).PublicKeyCredential;
  });

  it('returns null when PublicKeyCredential is not available', () => {
    delete (window as any).PublicKeyCredential;
    const { container } = renderWithTheme(<PasskeyLoginButton {...baseProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the passkey label regardless of whether email is present', () => {
    const { unmount } = renderWithTheme(<PasskeyLoginButton {...baseProps} />);
    expect(screen.getByText('login.signInWithPasskey')).toBeInTheDocument();
    unmount();
    renderWithTheme(<PasskeyLoginButton {...baseProps} email="user@example.com" />);
    expect(screen.getByText('login.signInWithPasskey')).toBeInTheDocument();
  });

  it('calls loginWithPasskey with email when present', () => {
    const loginWithPasskey = jest.fn();
    renderWithTheme(
      <PasskeyLoginButton {...baseProps} email="user@example.com" loginWithPasskey={loginWithPasskey} />
    );
    fireEvent.click(screen.getByText('login.signInWithPasskey'));
    expect(loginWithPasskey).toHaveBeenCalledWith('user@example.com');
  });

  it('calls loginWithPasskey with undefined when no email (usernameless)', () => {
    const loginWithPasskey = jest.fn();
    renderWithTheme(<PasskeyLoginButton {...baseProps} loginWithPasskey={loginWithPasskey} />);
    fireEvent.click(screen.getByText('login.signInWithPasskey'));
    expect(loginWithPasskey).toHaveBeenCalledWith(undefined);
  });

  it('shows failure message on failure', () => {
    renderWithTheme(<PasskeyLoginButton {...baseProps} failure />);
    expect(screen.getByText('login.passkeyFailure')).toBeInTheDocument();
  });
});
