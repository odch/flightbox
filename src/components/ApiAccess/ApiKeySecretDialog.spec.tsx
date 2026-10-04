import React from 'react';
import '../../i18n';
import {renderWithTheme, screen, fireEvent, act} from '../../../test/renderWithTheme';
import ApiKeySecretDialog from './ApiKeySecretDialog';

const PLAINTEXT = 'fbx_Ab3dEf6hIj9k_' + 'S'.repeat(43);

describe('ApiKeySecretDialog', () => {
  let writeText: jest.Mock;

  beforeEach(() => {
    writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {writeText},
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it('shows the key read-only with the warning', () => {
    renderWithTheme(<ApiKeySecretDialog apiKey={PLAINTEXT} onClose={jest.fn()}/>);

    expect(screen.getByRole('dialog', {name: 'Ihr neuer API-Schlüssel'})).toBeInTheDocument();
    const input = screen.getByLabelText('API-Schlüssel') as HTMLInputElement;
    expect(input.value).toBe(PLAINTEXT);
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveStyle('font-family: monospace');
    expect(input).toHaveFocus();
    expect(screen.getByText(/wird nur jetzt angezeigt/)).toHaveTextContent(
      'Dieser Schlüssel wird nur jetzt angezeigt und kann später nicht mehr abgerufen werden. Kopieren Sie ihn und bewahren Sie ihn sicher auf, wie ein Passwort.'
    );
  });

  it('copies the key to the clipboard', async () => {
    renderWithTheme(<ApiKeySecretDialog apiKey={PLAINTEXT} onClose={jest.fn()}/>);
    await act(async () => {
      fireEvent.click(screen.getByTitle('Copy to Clipboard'));
    });
    expect(writeText).toHaveBeenCalledWith(PLAINTEXT);
  });

  it('closes with the close button only, not by clicking next to it', () => {
    const onClose = jest.fn();
    renderWithTheme(<ApiKeySecretDialog apiKey={PLAINTEXT} onClose={onClose}/>);

    fireEvent.click(screen.getByTestId('modal-mask'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', {name: /Schliessen/}));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
