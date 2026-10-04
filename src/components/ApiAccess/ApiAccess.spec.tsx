import React from 'react';
import '../../i18n';
import {renderWithTheme, screen, fireEvent, act, within} from '../../../test/renderWithTheme';
import ApiAccess, {ApiAccessProps} from './ApiAccess';

const PLAINTEXT = 'fbx_Ab3dEf6hIj9k_' + 'S'.repeat(43);
const BASE = 'reports:airstat';
const INTERNAL = 'reports:airstat:internal';

const renderApiAccess = (props: Partial<ApiAccessProps> = {}) => {
  const allProps: ApiAccessProps = {
    keys: [],
    availableScopes: [BASE, INTERNAL],
    loadError: null,
    creating: false,
    createError: null,
    revoking: [],
    revokeError: null,
    loadApiKeys: jest.fn(),
    createApiKey: jest.fn(),
    revokeApiKey: jest.fn(),
    ...props,
  };
  return {...renderWithTheme(<ApiAccess {...allProps}/>), props: allProps};
};

describe('ApiAccess', () => {
  it('explains API keys and that a key is shown only once', () => {
    renderApiAccess();
    expect(screen.getByText(/Mit einem API-Schlüssel können externe Programme/)).toBeInTheDocument();
    expect(screen.getByText(/Ein Schlüssel wird nur einmal angezeigt/)).toBeInTheDocument();
  });

  it('shows the loading state before the keys are loaded', () => {
    renderApiAccess({keys: undefined});
    expect(screen.getByText('API-Schlüssel werden geladen ...')).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: /Schlüssel erstellen/})).toBeNull();
  });

  it('shows a load error with a retry button and no create form', () => {
    const {props} = renderApiAccess({keys: undefined, loadError: 'failed'});
    expect(screen.getByRole('alert')).toHaveTextContent('Die API-Schlüssel konnten nicht geladen werden.');
    expect(screen.queryByRole('button', {name: /Schlüssel erstellen/})).toBeNull();

    fireEvent.click(screen.getByRole('button', {name: /Erneut versuchen/}));
    expect(props.loadApiKeys).toHaveBeenCalledTimes(1);
  });

  it('asks to log in again when loading is refused', () => {
    renderApiAccess({keys: undefined, loadError: 'forbidden'});
    expect(screen.getByRole('alert')).toHaveTextContent('Bitte melden Sie sich erneut an.');
  });

  it('cannot show a key created after the page was left', () => {
    const createApiKey = jest.fn();
    const {unmount} = renderApiAccess({createApiKey});
    fireEvent.change(screen.getByLabelText('Name'), {target: {value: 'Statistikprogramm'}});
    fireEvent.click(screen.getByLabelText('Airstat-Report (BAZL)'));
    act(() => {
      fireEvent.click(screen.getByRole('button', {name: /Schlüssel erstellen/}));
    });

    unmount();

    expect(createApiKey.mock.calls[0][1](PLAINTEXT)).toBe(false);
  });

  it('shows how to use the API', () => {
    renderApiAccess();
    expect(screen.getByText('Verwendung')).toBeInTheDocument();
    expect(screen.getByTestId('api-endpoint')).toHaveTextContent(`${window.location.origin}/api/v1/reports/airstat`);
    expect(screen.getByTestId('api-status-endpoint')).toHaveTextContent(`${window.location.origin}/api/v1/aerodrome/status`);
  });

  it('shows the new key once in a dialog and drops it on close', () => {
    let shown;
    const createApiKey = jest.fn((_payload, onCreated) => {
      shown = onCreated(PLAINTEXT);
    });
    renderApiAccess({createApiKey});

    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.change(screen.getByLabelText('Name'), {target: {value: 'Statistikprogramm'}});
    fireEvent.click(screen.getByLabelText('Airstat-Report (BAZL)'));
    act(() => {
      fireEvent.click(screen.getByRole('button', {name: /Schlüssel erstellen/}));
    });

    expect(createApiKey).toHaveBeenCalledTimes(1);
    expect(shown).toBe(true);
    const dialog = screen.getByRole('dialog');
    expect((within(dialog).getByLabelText('API-Schlüssel') as HTMLInputElement).value).toBe(PLAINTEXT);

    fireEvent.click(within(dialog).getByRole('button', {name: /Schliessen/}));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.innerHTML).not.toContain(PLAINTEXT);
  });
});
