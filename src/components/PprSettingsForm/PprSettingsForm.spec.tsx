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

// The real picker opens a calendar dialog; this one takes the date typed in
jest.mock('../DatePicker', () => ({
  __esModule: true,
  default: ({ value, onChange, dataCy }: any) => (
    <input
      data-cy={dataCy}
      value={value || ''}
      onChange={e => onChange({ value: e.target.value || null })}
    />
  ),
}));

import PprSettingsForm from './PprSettingsForm';

const loadedSettings = {
  adminEmail: 'ppr@aerodrome.ch',
  answerMode: 'manual',
  pilotInfo: null,
  closures: [],
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

const byCy = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-cy="${name}"]`) as HTMLInputElement;

const emailInput = (container: HTMLElement) => byCy(container, 'adminEmail');

const saveButton = (container: HTMLElement) => byCy(container, 'ppr-settings-save');

const change = (container: HTMLElement, name: string, value: string) =>
  fireEvent.change(byCy(container, name), { target: { value } });

const save = () => fireEvent.click(screen.getByText('common.save'));

const savedSettings = (props: any) => props.savePprSettings.mock.calls[0][0];

describe('PprSettingsForm', () => {
  it('loads the settings on mount', () => {
    const { props } = renderForm({ loaded: false });
    expect(props.loadPprSettings).toHaveBeenCalledTimes(1);
  });

  it('shows when the settings could not be loaded', () => {
    const { container } = renderForm({ loaded: false, loadFailed: true });
    expect(screen.getByText('ppr.settings.loadFailed')).toBeTruthy();
    expect(emailInput(container)).toBeNull();
  });

  it('saves all settings', () => {
    const closures = [{ from: '2099-04-14', to: '2099-04-16', reason: 'Runway works' }];
    const { container, props } = renderForm({ answerMode: 'automatic', pilotInfo: 'Runway 05/23', closures });
    expect(saveButton(container).hasAttribute('disabled')).toBe(true);

    change(container, 'adminEmail', 'new@aerodrome.ch');
    save();

    expect(props.savePprSettings).toHaveBeenCalledWith({
      answerMode: 'automatic',
      pilotInfo: 'Runway 05/23',
      adminEmail: 'new@aerodrome.ch',
      closures,
    });
  });

  it('shows when saving failed', () => {
    renderForm({ saveFailed: true });
    expect(screen.getByText('ppr.settings.saveFailed')).toBeTruthy();
  });

  describe('notification address', () => {
    it('shows the current address', () => {
      const { container } = renderForm();
      expect(emailInput(container).value).toBe('ppr@aerodrome.ch');
      expect(screen.queryByText('ppr.settings.noAdminEmail')).toBeNull();
    });

    it('warns when no address is set while answering manually', () => {
      renderForm({ adminEmail: null });
      expect(screen.getByText('ppr.settings.noAdminEmail')).toBeTruthy();
    });

    it('does not warn when answering automatically: nobody has to answer', () => {
      renderForm({ adminEmail: null, answerMode: 'automatic' });
      expect(screen.queryByText('ppr.settings.noAdminEmail')).toBeNull();
    });

    it('saves a changed address, trimmed', () => {
      const { container, props } = renderForm();

      change(container, 'adminEmail', ' new@aerodrome.ch ');
      save();

      expect(savedSettings(props).adminEmail).toBe('new@aerodrome.ch');
    });

    it('saves an emptied field as no address', () => {
      const { container, props } = renderForm();

      change(container, 'adminEmail', '');
      save();

      expect(savedSettings(props).adminEmail).toBeNull();
    });

    it('does not save an invalid address', () => {
      const { container, props } = renderForm();

      change(container, 'adminEmail', 'not-an-address');
      fireEvent.blur(emailInput(container));
      save();

      expect(props.savePprSettings).not.toHaveBeenCalled();
      expect(screen.getByText('ppr.settings.invalidEmail')).toBeTruthy();
    });
  });

  describe('answer mode', () => {
    it('shows the information for pilots only when answering automatically', () => {
      const { container } = renderForm();
      expect(byCy(container, 'pilotInfo')).toBeNull();

      fireEvent.click(byCy(container, 'answerMode-automatic'));

      expect(byCy(container, 'pilotInfo')).not.toBeNull();
    });

    it('saves automatic answers with the information for pilots, trimmed', () => {
      const { container, props } = renderForm();

      fireEvent.click(byCy(container, 'answerMode-automatic'));
      change(container, 'pilotInfo', ' Runway 05/23\nLanding fee CHF 20 ');
      save();

      expect(savedSettings(props)).toEqual(expect.objectContaining({
        answerMode: 'automatic',
        pilotInfo: 'Runway 05/23\nLanding fee CHF 20',
      }));
    });

    it('keeps the information for pilots when going back to manual answers', () => {
      const { container, props } = renderForm({ answerMode: 'automatic', pilotInfo: 'Runway 05/23' });

      fireEvent.click(byCy(container, 'answerMode-manual'));
      expect(byCy(container, 'pilotInfo')).toBeNull();
      save();

      expect(savedSettings(props)).toEqual(expect.objectContaining({ answerMode: 'manual', pilotInfo: 'Runway 05/23' }));
    });

    it('saves emptied information for pilots as none', () => {
      const { container, props } = renderForm({ answerMode: 'automatic', pilotInfo: 'Runway 05/23' });

      change(container, 'pilotInfo', '  ');
      save();

      expect(savedSettings(props).pilotInfo).toBeNull();
    });
  });

  describe('closures', () => {
    const runwayWorks = { from: '2099-04-14', to: '2099-04-16', reason: 'Runway works' };

    it('says when none are planned', () => {
      renderForm();
      expect(screen.getByText('ppr.settings.noClosures')).toBeTruthy();
    });

    it('shows the closures that have not ended, and saves without the others', () => {
      const ended = { from: '2020-01-01', to: '2020-01-02', reason: 'New year' };
      const { container, props } = renderForm({ closures: [ended, runwayWorks] });

      expect(byCy(container, 'ppr-closure-0-reason').value).toBe('Runway works');
      expect(byCy(container, 'ppr-closure-1-reason')).toBeNull();

      change(container, 'adminEmail', 'new@aerodrome.ch');
      save();

      expect(savedSettings(props).closures).toEqual([runwayWorks]);
    });

    it('adds a closure, ending on its first day unless changed', () => {
      const { container, props } = renderForm();

      fireEvent.click(byCy(container, 'ppr-closure-add'));
      change(container, 'ppr-closure-0-from', '2099-12-24');
      expect(byCy(container, 'ppr-closure-0-to').value).toBe('2099-12-24');
      change(container, 'ppr-closure-0-reason', ' Christmas ');
      save();

      expect(savedSettings(props).closures).toEqual([{ from: '2099-12-24', to: '2099-12-24', reason: 'Christmas' }]);
    });

    it('keeps an end that is after a changed start', () => {
      const { container } = renderForm({ closures: [runwayWorks] });

      change(container, 'ppr-closure-0-from', '2099-04-15');

      expect(byCy(container, 'ppr-closure-0-to').value).toBe('2099-04-16');
    });

    it('removes a closure', () => {
      const { container, props } = renderForm({ closures: [runwayWorks] });

      fireEvent.click(byCy(container, 'ppr-closure-0-remove'));
      save();

      expect(savedSettings(props).closures).toEqual([]);
    });

    it('points out missing values once saving was tried, and does not save', () => {
      const { container, props } = renderForm();

      fireEvent.click(byCy(container, 'ppr-closure-add'));
      expect(screen.queryByText('ppr.settings.closureDatesRequired')).toBeNull();
      expect(screen.queryByText('ppr.settings.closureReasonRequired')).toBeNull();

      save();

      expect(props.savePprSettings).not.toHaveBeenCalled();
      expect(screen.getByText('ppr.settings.closureDatesRequired')).toBeTruthy();
      expect(screen.getByText('ppr.settings.closureReasonRequired')).toBeTruthy();
    });

    it('points out an end before the start right away', () => {
      const { container, props } = renderForm({ closures: [runwayWorks] });

      change(container, 'ppr-closure-0-to', '2099-04-13');
      expect(screen.getByText('ppr.settings.closureOrder')).toBeTruthy();

      save();
      expect(props.savePprSettings).not.toHaveBeenCalled();
    });
  });
});
