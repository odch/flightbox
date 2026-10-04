import React from 'react';
import '../../i18n';
import {renderWithTheme, screen, fireEvent, within} from '../../../test/renderWithTheme';
import ApiKeyList from './ApiKeyList';
import {ApiKey} from '../../modules/apiKeys';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1791021600000; // 03.10.2026 12:00 (Zurich)

const key = (id: string, overrides: Partial<ApiKey> = {}): ApiKey => ({
  id,
  name: `Schlüssel ${id}`,
  scopes: ['reports:airstat'],
  createdAt: 1791043200000,
  createdBy: 'admin@example.ch',
  expiresAt: null,
  lastUsedAt: null,
  ...overrides,
});

const renderList = (props: Partial<React.ComponentProps<typeof ApiKeyList>> = {}) => {
  const onRevoke = jest.fn();
  const utils = renderWithTheme(
    <ApiKeyList
      keys={[key('a')]}
      revoking={[]}
      revokeError={null}
      onRevoke={onRevoke}
      now={NOW}
      {...props}
    />
  );
  return {...utils, onRevoke};
};

describe('ApiKeyList', () => {
  it('shows name, permission labels, creation, expiry and last use', () => {
    renderList({
      keys: [key('a', {
        name: 'Statistikprogramm Hans',
        scopes: ['reports:airstat', 'reports:airstat:internal'],
        expiresAt: 1822579200000,
        lastUsedAt: 1791129600000,
      })],
    });

    const row = screen.getByTestId('api-key-a');
    expect(within(row).getByText('Statistikprogramm Hans')).toBeInTheDocument();
    expect(within(row).getByText('Airstat-Report (BAZL)')).toBeInTheDocument();
    expect(within(row).getByText(
      'Airstat-Report mit zusätzlichen Informationen (Namen, E-Mail-Adressen, Bemerkungen, Rechnungsempfänger)'
    )).toBeInTheDocument();
    expect(within(row).getByText('03.10.2026')).toBeInTheDocument();
    expect(within(row).getByText('von admin@example.ch')).toBeInTheDocument();
    expect(within(row).getByText('03.10.2027')).toBeInTheDocument();
    expect(within(row).getByText('04.10.2026 18:00')).toBeInTheDocument();
  });

  it('shows "Unbegrenzt" and "Nie" for unlimited and unused keys', () => {
    renderList();
    const row = screen.getByTestId('api-key-a');
    expect(within(row).getByText('Unbegrenzt')).toBeInTheDocument();
    expect(within(row).getByText('Nie')).toBeInTheDocument();
  });

  it('shows the raw scope for an unknown scope', () => {
    renderList({keys: [key('a', {scopes: ['movements:read']})]});
    expect(screen.getByText('movements:read')).toBeInTheDocument();
  });

  it('highlights expired keys and keys expiring within 30 days', () => {
    renderList({
      keys: [
        key('expired', {expiresAt: NOW - DAY}),
        key('soon', {expiresAt: NOW + 30 * DAY}),
        key('valid', {expiresAt: NOW + 31 * DAY}),
        key('unlimited', {expiresAt: null}),
      ],
    });

    const expiry = (id: string) => screen.getByTestId(`api-key-${id}`).querySelector('[data-expiry]') as HTMLElement;

    expect(expiry('expired').getAttribute('data-expiry')).toBe('expired');
    expect(within(expiry('expired')).getByText('Abgelaufen')).toBeInTheDocument();
    expect(expiry('expired')).toHaveStyle('color: #e00f00');

    expect(expiry('soon').getAttribute('data-expiry')).toBe('expiresSoon');
    expect(within(expiry('soon')).getByText('Läuft bald ab')).toBeInTheDocument();
    expect(expiry('soon')).toHaveStyle('font-weight: bold');

    expect(expiry('valid').getAttribute('data-expiry')).toBe('valid');
    expect(within(expiry('valid')).queryByText('Läuft bald ab')).toBeNull();
    expect(expiry('valid')).not.toHaveStyle('font-weight: bold');

    expect(expiry('unlimited').getAttribute('data-expiry')).toBe('unlimited');
  });

  it('shows the empty state', () => {
    renderList({keys: []});
    expect(screen.getByText('Es sind noch keine API-Schlüssel vorhanden.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('asks for confirmation before revoking', () => {
    const {onRevoke} = renderList({keys: [key('a'), key('b')]});

    fireEvent.click(within(screen.getByTestId('api-key-b')).getByRole('button', {name: /Widerrufen/}));

    expect(screen.getByText(/Möchten Sie den API-Schlüssel 'Schlüssel b' wirklich widerrufen\?/)).toBeInTheDocument();
    expect(onRevoke).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', {name: /Abbrechen/}));
    expect(screen.queryByText(/wirklich widerrufen/)).toBeNull();
    expect(onRevoke).not.toHaveBeenCalled();

    fireEvent.click(within(screen.getByTestId('api-key-b')).getByRole('button', {name: /Widerrufen/}));
    const dialog = screen.getByText(/wirklich widerrufen/).parentElement as HTMLElement;
    fireEvent.click(within(dialog).getByRole('button', {name: /Widerrufen/}));

    expect(onRevoke).toHaveBeenCalledTimes(1);
    expect(onRevoke).toHaveBeenCalledWith('b');
    expect(screen.queryByText(/wirklich widerrufen/)).toBeNull();
  });

  it('disables the revoke button of a key being revoked', () => {
    renderList({keys: [key('a'), key('b')], revoking: ['a']});
    expect(within(screen.getByTestId('api-key-a')).getByRole('button')).toBeDisabled();
    expect(within(screen.getByTestId('api-key-b')).getByRole('button')).not.toBeDisabled();
  });

  it('shows a revoke error', () => {
    renderList({revokeError: 'failed'});
    expect(screen.getByRole('alert')).toHaveTextContent('Der API-Schlüssel konnte nicht widerrufen werden.');
  });

  it('asks to log in again when revoking is refused', () => {
    renderList({revokeError: 'forbidden'});
    expect(screen.getByRole('alert')).toHaveTextContent('Bitte melden Sie sich erneut an.');
  });
});
