import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  initReactI18next: { type: '3rdParty', init: () => undefined },
}));

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({ icon }) {
    return <span data-testid="material-icon" data-icon={icon} />;
  };
});

import PprSettingsForm from './PprSettingsForm';

const loadedSettings = {
  adminEmail: 'ppr@aerodrome.ch',
  loaded: true,
  loadFailed: false,
  saving: false,
  saved: false,
  saveFailed: false,
};

const renderForm = (settings = {}) => {
  const props = {
    settings: { ...loadedSettings, ...settings },
    loadPprSettings: jest.fn(),
    savePprSettings: jest.fn(),
  };
  return { ...renderWithTheme(<PprSettingsForm {...props} />), props };
};

const emailInput = (container: HTMLElement) =>
  container.querySelector('[data-cy="adminEmail"]') as HTMLInputElement;

const saveButton = (container: HTMLElement) =>
  container.querySelector('[data-cy="ppr-settings-save"]') as HTMLButtonElement;

describe('PprSettingsForm', () => {
  it('loads the settings on mount', () => {
    const { props } = renderForm({ loaded: false });
    expect(props.loadPprSettings).toHaveBeenCalledTimes(1);
  });

  it('shows the current address', () => {
    const { container } = renderForm();
    expect(emailInput(container).value).toBe('ppr@aerodrome.ch');
    expect(screen.queryByText('ppr.settings.noAdminEmail')).toBeNull();
  });

  it('warns when no address is set', () => {
    renderForm({ adminEmail: null });
    expect(screen.getByText('ppr.settings.noAdminEmail')).toBeTruthy();
  });

  it('saves a changed address, trimmed', () => {
    const { container, props } = renderForm();
    expect(saveButton(container).hasAttribute('disabled')).toBe(true);

    fireEvent.change(emailInput(container), { target: { value: ' new@aerodrome.ch ' } });
    fireEvent.click(screen.getByText('common.save'));

    expect(props.savePprSettings).toHaveBeenCalledWith({ adminEmail: 'new@aerodrome.ch' });
  });

  it('saves an emptied field as no address', () => {
    const { container, props } = renderForm();

    fireEvent.change(emailInput(container), { target: { value: '' } });
    fireEvent.click(screen.getByText('common.save'));

    expect(props.savePprSettings).toHaveBeenCalledWith({ adminEmail: null });
  });

  it('does not save an invalid address', () => {
    const { container, props } = renderForm();

    fireEvent.change(emailInput(container), { target: { value: 'not-an-address' } });
    fireEvent.blur(emailInput(container));
    fireEvent.click(screen.getByText('common.save'));

    expect(props.savePprSettings).not.toHaveBeenCalled();
    expect(screen.getByText('ppr.settings.invalidEmail')).toBeTruthy();
  });

  it('shows when saving failed', () => {
    renderForm({ saveFailed: true });
    expect(screen.getByText('ppr.settings.saveFailed')).toBeTruthy();
  });

  it('shows when the settings could not be loaded', () => {
    const { container } = renderForm({ loaded: false, loadFailed: true });
    expect(screen.getByText('ppr.settings.loadFailed')).toBeTruthy();
    expect(emailInput(container)).toBeNull();
  });
});
