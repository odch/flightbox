import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../../test/renderWithTheme';
import PasskeyManager from './PasskeyManager';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => (opts && opts.date ? `${key}:${opts.date}` : key) }),
}));

jest.mock('../../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({ icon }: { icon: string }) {
    return <span data-testid={`icon-${icon}`} />;
  };
});

describe('PasskeyManager', () => {
  const baseProps = {
    passkeys: [],
    submitting: false,
    failure: false,
    removalFailure: false,
    loadPasskeys: jest.fn(),
    registerPasskey: jest.fn(),
    removePasskey: jest.fn(),
  };

  beforeEach(() => {
    (window as any).PublicKeyCredential = function () {};
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete (window as any).PublicKeyCredential;
  });

  it('calls loadPasskeys on mount', () => {
    const loadPasskeys = jest.fn();
    renderWithTheme(<PasskeyManager {...baseProps} loadPasskeys={loadPasskeys} />);
    expect(loadPasskeys).toHaveBeenCalled();
  });

  it('shows empty notice when no passkeys', () => {
    renderWithTheme(<PasskeyManager {...baseProps} />);
    expect(screen.getByText('profile.passkeysEmpty')).toBeInTheDocument();
  });

  it('lists registered passkeys', () => {
    const passkeys = [
      { credentialId: 'c1', deviceName: 'My Laptop', createdAt: 0, lastUsedAt: null },
      { credentialId: 'c2', deviceName: 'My Phone', createdAt: 0, lastUsedAt: 1000 },
    ];
    renderWithTheme(<PasskeyManager {...baseProps} passkeys={passkeys} />);
    expect(screen.getByText('My Laptop')).toBeInTheDocument();
    expect(screen.getByText('My Phone')).toBeInTheDocument();
  });

  it('hides register button when WebAuthn unsupported', () => {
    delete (window as any).PublicKeyCredential;
    renderWithTheme(<PasskeyManager {...baseProps} />);
    expect(screen.queryByText('profile.passkeysRegister')).not.toBeInTheDocument();
  });

  it('calls registerPasskey when register button is clicked', () => {
    const registerPasskey = jest.fn();
    renderWithTheme(<PasskeyManager {...baseProps} registerPasskey={registerPasskey} />);
    fireEvent.click(screen.getByText('profile.passkeysRegister'));
    expect(registerPasskey).toHaveBeenCalled();
  });

  it('shows error when registration fails', () => {
    renderWithTheme(
      <PasskeyManager {...baseProps} failure errorMessage="custom error" />
    );
    expect(screen.getByText('custom error')).toBeInTheDocument();
  });

  it('shows default failure message when no errorMessage', () => {
    renderWithTheme(<PasskeyManager {...baseProps} failure />);
    expect(screen.getByText('profile.passkeysRegistrationFailure')).toBeInTheDocument();
  });
});
