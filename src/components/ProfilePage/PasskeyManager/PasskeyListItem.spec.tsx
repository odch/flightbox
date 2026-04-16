import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../../test/renderWithTheme';
import PasskeyListItem from './PasskeyListItem';
import type { Passkey } from '../../../modules/auth';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => (opts && opts.date ? `${key}:${opts.date}` : key),
  }),
}));

jest.mock('../../MaterialIcon', () => {
  const ReactLocal = require('react');
  return function MockMaterialIcon({ icon }: { icon: string }) {
    return ReactLocal.createElement('span', { 'data-testid': `icon-${icon}` });
  };
});

describe('PasskeyListItem', () => {
  const basePasskey: Passkey = {
    credentialId: 'cred-abc',
    deviceName: 'Mac',
    createdAt: Date.UTC(2026, 3, 15),
    lastUsedAt: null,
  };

  it('renders device name and created date', () => {
    renderWithTheme(<PasskeyListItem passkey={basePasskey} onRemove={jest.fn()} />);
    expect(screen.getByText('Mac')).toBeInTheDocument();
    expect(screen.getByText(/profile.passkeysCreatedAt:/)).toBeInTheDocument();
  });

  it('shows "never used" when lastUsedAt is null', () => {
    renderWithTheme(<PasskeyListItem passkey={basePasskey} onRemove={jest.fn()} />);
    expect(screen.getByText('profile.passkeysLastUsedNever')).toBeInTheDocument();
  });

  it('shows last-used date when set', () => {
    const p = { ...basePasskey, lastUsedAt: Date.UTC(2026, 3, 18) };
    renderWithTheme(<PasskeyListItem passkey={p} onRemove={jest.fn()} />);
    expect(screen.getByText(/profile.passkeysLastUsed:/)).toBeInTheDocument();
  });

  it('does not render the confirmation modal by default', () => {
    renderWithTheme(<PasskeyListItem passkey={basePasskey} onRemove={jest.fn()} />);
    expect(screen.queryByText('profile.passkeysRemoveConfirm')).not.toBeInTheDocument();
  });

  it('opens the confirmation modal when trash icon is clicked', () => {
    renderWithTheme(<PasskeyListItem passkey={basePasskey} onRemove={jest.fn()} />);
    fireEvent.click(screen.getByTestId('icon-delete'));
    expect(screen.getByText('profile.passkeysRemoveConfirm')).toBeInTheDocument();
  });

  it('does not call onRemove when opening the modal', () => {
    const onRemove = jest.fn();
    renderWithTheme(<PasskeyListItem passkey={basePasskey} onRemove={onRemove} />);
    fireEvent.click(screen.getByTestId('icon-delete'));
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('calls onRemove with credentialId and closes modal on confirm', () => {
    const onRemove = jest.fn();
    renderWithTheme(<PasskeyListItem passkey={basePasskey} onRemove={onRemove} />);
    fireEvent.click(screen.getByTestId('icon-delete'));
    fireEvent.click(screen.getByText('profile.passkeysRemove'));
    expect(onRemove).toHaveBeenCalledWith('cred-abc');
    expect(screen.queryByText('profile.passkeysRemoveConfirm')).not.toBeInTheDocument();
  });

  it('closes the modal on cancel without calling onRemove', () => {
    const onRemove = jest.fn();
    renderWithTheme(<PasskeyListItem passkey={basePasskey} onRemove={onRemove} />);
    fireEvent.click(screen.getByTestId('icon-delete'));
    fireEvent.click(screen.getByText('common.cancel'));
    expect(screen.queryByText('profile.passkeysRemoveConfirm')).not.toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('closes the modal when the backdrop is clicked', () => {
    const onRemove = jest.fn();
    renderWithTheme(<PasskeyListItem passkey={basePasskey} onRemove={onRemove} />);
    fireEvent.click(screen.getByTestId('icon-delete'));
    fireEvent.click(screen.getByTestId('modal-mask'));
    expect(screen.queryByText('profile.passkeysRemoveConfirm')).not.toBeInTheDocument();
    expect(onRemove).not.toHaveBeenCalled();
  });
});
