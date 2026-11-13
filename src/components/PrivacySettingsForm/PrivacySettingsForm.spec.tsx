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

import PrivacySettingsForm from './PrivacySettingsForm';

const pprSettings = {
  retentionDays: 60,
  loaded: true,
  loadFailed: false,
  saving: false,
  saveFailed: false,
};

const renderForm = (props = {}) => {
  const allProps = {
    privacyPolicyUrl: { url: 'https://aerodrome.ch/privacy', saving: false },
    movementRetentionDays: { days: 365, saving: false },
    messageRetentionDays: { days: 90, saving: false },
    setPrivacyPolicyUrl: jest.fn(),
    setMovementRetentionDays: jest.fn(),
    setMessageRetentionDays: jest.fn(),
    pprSettings,
    loadPprSettings: jest.fn(),
    savePprSettings: jest.fn(),
    ...props,
  };
  return { ...renderWithTheme(<PrivacySettingsForm {...allProps} />), props: allProps };
};

const input = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-cy="${name}"]`) as HTMLInputElement;

const save = () => fireEvent.click(screen.getByText('privacy.save'));

describe('PrivacySettingsForm', () => {
  it('shows only the privacy settings without PPR', () => {
    const { container, props } = renderForm();

    expect(input(container, 'movementRetentionDays')).not.toBeNull();
    expect(input(container, 'pprRetentionDays')).toBeNull();
    expect(props.loadPprSettings).not.toHaveBeenCalled();
  });

  it('shows only the PPR retention for aerodromes with PPR but without privacy settings', () => {
    const { container, props } = renderForm({ privacyEnabled: false, pprEnabled: true });

    expect(props.loadPprSettings).toHaveBeenCalledTimes(1);
    expect(input(container, 'pprRetentionDays').value).toBe('60');
    expect(input(container, 'movementRetentionDays')).toBeNull();
    expect(input(container, 'privacyPolicyUrl')).toBeNull();
  });

  it('saves a changed PPR retention without touching the privacy settings', () => {
    const { container, props } = renderForm({ privacyEnabled: false, pprEnabled: true });

    fireEvent.change(input(container, 'pprRetentionDays'), { target: { value: '90' } });
    save();

    expect(props.savePprSettings).toHaveBeenCalledWith({ retentionDays: 90 });
    expect(props.setMovementRetentionDays).not.toHaveBeenCalled();
    expect(props.setPrivacyPolicyUrl).not.toHaveBeenCalled();
  });

  it('saves an emptied PPR retention as the default', () => {
    const { container, props } = renderForm({ privacyEnabled: false, pprEnabled: true });

    fireEvent.change(input(container, 'pprRetentionDays'), { target: { value: '' } });
    save();

    expect(props.savePprSettings).toHaveBeenCalledWith({ retentionDays: null });
  });

  it('does not save the PPR retention when only the privacy settings changed', () => {
    const { container, props } = renderForm({ pprEnabled: true });

    fireEvent.change(input(container, 'messageRetentionDays'), { target: { value: '30' } });
    save();

    expect(props.setMessageRetentionDays).toHaveBeenCalledWith(30);
    expect(props.savePprSettings).not.toHaveBeenCalled();
  });

  it('refuses a PPR retention outside 1 to 3650 days', () => {
    const { container, props } = renderForm({ privacyEnabled: false, pprEnabled: true });

    fireEvent.change(input(container, 'pprRetentionDays'), { target: { value: '5000' } });
    fireEvent.blur(input(container, 'pprRetentionDays'));
    save();

    expect(props.savePprSettings).not.toHaveBeenCalled();
    expect(screen.getByText('privacy.pprRetentionDaysInvalid')).toBeTruthy();
  });

  it('does not offer the PPR retention while it could not be loaded', () => {
    const { container } = renderForm({
      privacyEnabled: false,
      pprEnabled: true,
      pprSettings: { ...pprSettings, loaded: false, loadFailed: true },
    });

    expect(screen.getByText('ppr.settings.loadFailed')).toBeTruthy();
    expect(input(container, 'pprRetentionDays')).toBeNull();
  });

  it('shows when saving the PPR retention failed', () => {
    renderForm({ privacyEnabled: false, pprEnabled: true, pprSettings: { ...pprSettings, saveFailed: true } });

    expect(screen.getByText('privacy.pprRetentionDaysSaveFailed')).toBeTruthy();
  });
});
