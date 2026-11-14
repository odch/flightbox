import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { renderWithTheme, screen, fireEvent, act } from '../../../test/renderWithTheme';

// The key, with the count where one is given
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      options && options.count !== undefined ? `${key} (${options.count})` : key,
  }),
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

// As in test/renderWithTheme, for the renders after the first
const theme = {
  colors: {
    main: '#003863',
    background: '#fafafa',
    danger: '#e00f00',
  },
  images: { logo: '' },
};

const withWrappers = (element: React.ReactElement) => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>{element}</ThemeProvider>
  </BrowserRouter>
);

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

// How the store changes while saving (src/modules/ppr/reducer.ts)
const savingStarts = { saving: true, saved: false, saveFailed: false };
const savingSucceeds = (stored = {}) => ({ saving: false, saved: true, ...stored });
const savingFails = { saving: false, saveFailed: true };

// The settings as the page shows them first, in short; update() changes
// them as the store does
const renderSettings = (settings = {}) => {
  const props = {
    settings: { ...loadedSettings, ...settings },
    loadPprSettings: jest.fn(),
    savePprSettings: jest.fn(),
  };
  const rendered = renderWithTheme(<PprSettingsForm {...props} />);
  const update = (changes: Record<string, unknown>) => {
    props.settings = { ...props.settings, ...changes };
    rendered.rerender(withWrappers(<PprSettingsForm {...props} />));
  };
  return { ...rendered, props, update };
};

const edit = () => fireEvent.click(screen.getByText('common.edit'));

const cancel = () => fireEvent.click(screen.getByText('common.cancel'));

// The form, opened from the summary
const renderForm = (settings = {}) => {
  const rendered = renderSettings(settings);
  edit();
  return rendered;
};

const byCy = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-cy="${name}"]`) as HTMLInputElement;

const emailInput = (container: HTMLElement) => byCy(container, 'adminEmail');

const saveButton = (container: HTMLElement) => byCy(container, 'ppr-settings-save');

const summaryRow = (container: HTMLElement, name: string) => byCy(container, `ppr-settings-summary-${name}`);

const change = (container: HTMLElement, name: string, value: string) =>
  fireEvent.change(byCy(container, name), { target: { value } });

const save = () => fireEvent.click(screen.getByText('common.save'));

const savedSettings = (props: any) => props.savePprSettings.mock.calls[0][0];

describe('PprSettingsForm', () => {
  it('loads the settings on mount', () => {
    const { props } = renderSettings({ loaded: false });
    expect(props.loadPprSettings).toHaveBeenCalledTimes(1);
  });

  it('shows when the settings could not be loaded', () => {
    const { container } = renderSettings({ loaded: false, loadFailed: true });
    expect(screen.getByText('ppr.settings.loadFailed')).toBeTruthy();
    expect(byCy(container, 'ppr-settings-summary')).toBeNull();
    expect(emailInput(container)).toBeNull();
  });

  describe('summary', () => {
    it('shows the stored settings instead of the form', () => {
      const { container } = renderSettings();

      expect(summaryRow(container, 'answer')).toHaveTextContent('ppr.settings.answerManual');
      expect(summaryRow(container, 'closures')).toHaveTextContent('ppr.settings.noClosures');
      expect(summaryRow(container, 'notification')).toHaveTextContent('ppr@aerodrome.ch');
      expect(emailInput(container)).toBeNull();
      expect(saveButton(container)).toBeNull();
    });

    it('shows automatic answers, without the information for pilots', () => {
      const { container } = renderSettings({ answerMode: 'automatic', pilotInfo: 'Runway 05/23' });

      expect(summaryRow(container, 'answer')).toHaveTextContent('ppr.settings.answerAutomatic');
      expect(screen.queryByText(/Runway 05\/23/)).toBeNull();
    });

    describe('blocked days', () => {
      const periods = (container: HTMLElement) =>
        Array.from(summaryRow(container, 'closures').querySelectorAll('li')).map(item => item.textContent);

      const blockedDays = (count: number) => Array.from({ length: count }, (_, index) => ({
        from: `2099-05-0${index + 1}`,
        to: `2099-05-0${index + 1}`,
        reason: `Event ${index + 1}`,
      }));

      it('lists a period with its first and last day and the reason', () => {
        const { container } = renderSettings({
          closures: [{ from: '2099-04-14', to: '2099-04-16', reason: 'Runway works' }],
        });
        expect(periods(container)).toEqual(['14.04.2099 – 16.04.2099 · Runway works']);
      });

      it('lists a single day once', () => {
        const { container } = renderSettings({
          closures: [{ from: '2099-12-24', to: '2099-12-24', reason: 'Christmas' }],
        });
        expect(periods(container)).toEqual(['24.12.2099 · Christmas']);
      });

      it('leaves out the periods that have ended', () => {
        const ended = { from: '2020-01-01', to: '2020-01-02', reason: 'New year' };

        const { container } = renderSettings({ closures: [ended] });

        expect(summaryRow(container, 'closures')).toHaveTextContent('ppr.settings.noClosures');
        expect(periods(container)).toEqual([]);
      });

      it('lists up to three periods', () => {
        const { container } = renderSettings({ closures: blockedDays(3) });
        expect(periods(container)).toEqual(['01.05.2099 · Event 1', '02.05.2099 · Event 2', '03.05.2099 · Event 3']);
      });

      it('counts the periods after the first three', () => {
        const { container } = renderSettings({ closures: blockedDays(4) });
        expect(periods(container)).toEqual([
          '01.05.2099 · Event 1',
          '02.05.2099 · Event 2',
          '03.05.2099 · Event 3',
          'ppr.settings.moreClosures (1)',
        ]);
      });

      it('counts only the periods that have not ended', () => {
        const ended = { from: '2020-01-01', to: '2020-01-02', reason: 'New year' };
        const { container } = renderSettings({ closures: [ended, ...blockedDays(6)] });
        expect(periods(container)).toHaveLength(4);
        expect(periods(container)[0]).toBe('01.05.2099 · Event 1');
        expect(periods(container)[3]).toBe('ppr.settings.moreClosures (3)');
      });
    });

    describe('without a notification address', () => {
      it('warns while answering manually', () => {
        const { container } = renderSettings({ adminEmail: null });

        const warning = screen.getByText('ppr.settings.noAdminEmail');
        expect(summaryRow(container, 'notification')).toContainElement(warning);
        expect(warning).toHaveStyle('color: #dc3545');
      });

      it('shows none while answering automatically: nobody has to answer', () => {
        const { container } = renderSettings({ adminEmail: null, answerMode: 'automatic' });

        expect(summaryRow(container, 'notification')).toHaveTextContent(/^-$/);
        expect(screen.queryByText('ppr.settings.noAdminEmail')).toBeNull();
      });
    });
  });

  describe('editing', () => {
    it('opens the form with the stored settings', () => {
      const { container } = renderForm({ answerMode: 'automatic', pilotInfo: 'Runway 05/23' });

      expect(byCy(container, 'ppr-settings-summary')).toBeNull();
      expect(byCy(container, 'pilotInfo').value).toBe('Runway 05/23');
      expect(emailInput(container).value).toBe('ppr@aerodrome.ch');
      expect(saveButton(container)).toBeDisabled();
      expect(byCy(container, 'ppr-settings-cancel')).toBeEnabled();
    });

    it('focuses the form when it opens and the edit button when it closes', () => {
      const { container } = renderSettings();

      edit();
      expect(document.activeElement).toBe(screen.getByRole('form', { name: 'ppr.settings.title' }));

      cancel();
      expect(document.activeElement).toBe(byCy(container, 'ppr-settings-edit'));
    });

    it('discards the changes when cancelled', () => {
      const { container, props } = renderForm();

      change(container, 'adminEmail', 'new@aerodrome.ch');
      cancel();

      expect(props.savePprSettings).not.toHaveBeenCalled();
      expect(summaryRow(container, 'notification')).toHaveTextContent('ppr@aerodrome.ch');

      edit();
      expect(emailInput(container).value).toBe('ppr@aerodrome.ch');
    });

    it('cannot be cancelled while saving', () => {
      const { container, update } = renderForm();

      change(container, 'adminEmail', 'new@aerodrome.ch');
      save();
      update(savingStarts);

      expect(byCy(container, 'ppr-settings-cancel')).toBeDisabled();
      expect(saveButton(container)).toBeDisabled();
    });

    describe('saving', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      const saveNewAddress = (container: HTMLElement, update: (changes: Record<string, unknown>) => void) => {
        change(container, 'adminEmail', 'new@aerodrome.ch');
        save();
        update(savingStarts);
      };

      it('closes the form once saved and confirms it for 5 seconds', () => {
        const { container, props, update } = renderForm();

        saveNewAddress(container, update);
        expect(savedSettings(props).adminEmail).toBe('new@aerodrome.ch');
        expect(emailInput(container)).not.toBeNull();

        update(savingSucceeds({ adminEmail: 'new@aerodrome.ch' }));

        expect(emailInput(container)).toBeNull();
        expect(summaryRow(container, 'notification')).toHaveTextContent('new@aerodrome.ch');
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('common.saved');

        act(() => {
          jest.advanceTimersByTime(4999);
        });
        expect(status).toHaveTextContent('common.saved');

        act(() => {
          jest.advanceTimersByTime(1);
        });
        // The live region stays, for the next confirmation
        expect(screen.getByRole('status')).toBe(status);
        expect(status).toBeEmptyDOMElement();
      });

      it('keeps its live region on the page while the summary and the form take turns', () => {
        const { container, update } = renderSettings();
        const status = screen.getByRole('status');
        expect(status).toBeEmptyDOMElement();

        edit();
        expect(screen.getByRole('status')).toBe(status);

        saveNewAddress(container, update);
        update(savingSucceeds({ adminEmail: 'new@aerodrome.ch' }));

        expect(screen.getByRole('status')).toBe(status);
        expect(status).toHaveTextContent('common.saved');
      });

      it('shows the confirmation as the green pill next to "Bearbeiten", for the eye only', () => {
        const { container, update } = renderForm();
        expect(byCy(container, 'ppr-settings-saved')).toBeNull();

        saveNewAddress(container, update);
        update(savingSucceeds({ adminEmail: 'new@aerodrome.ch' }));

        const pill = byCy(container, 'ppr-settings-saved');
        expect(pill).toHaveTextContent('common.saved');
        expect(pill).toHaveStyle('color: #2e7d32');
        expect(pill).toHaveAttribute('aria-hidden', 'true');
        expect(pill.querySelector('[data-icon="check"]')).not.toBeNull();
        expect(pill.parentElement).toBe(byCy(container, 'ppr-settings-edit').parentElement);

        act(() => {
          jest.advanceTimersByTime(5000);
        });
        expect(byCy(container, 'ppr-settings-saved')).toBeNull();
      });

      it('no longer confirms the save once the form opens again', () => {
        const { container, update } = renderForm();
        saveNewAddress(container, update);
        update(savingSucceeds({ adminEmail: 'new@aerodrome.ch' }));
        expect(screen.getByRole('status')).toHaveTextContent('common.saved');

        edit();
        cancel();

        expect(screen.getByRole('status')).toBeEmptyDOMElement();
      });

      it('focuses the edit button when the form closes after saving', () => {
        const { container, update } = renderForm();
        saveNewAddress(container, update);

        update(savingSucceeds({ adminEmail: 'new@aerodrome.ch' }));

        expect(document.activeElement).toBe(byCy(container, 'ppr-settings-edit'));
      });

      it('keeps the form open with the changes when saving failed', () => {
        const { container, update } = renderForm();
        saveNewAddress(container, update);

        update(savingFails);

        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('ppr.settings.saveFailed');
        expect(alert).toHaveStyle('color: #e00f00');
        expect(emailInput(container).value).toBe('new@aerodrome.ch');
        expect(screen.queryByText('common.saved')).toBeNull();
      });

      it('takes the error back when saving again', () => {
        const { container, props, update } = renderForm();
        saveNewAddress(container, update);
        update(savingFails);

        save();
        expect(props.savePprSettings).toHaveBeenCalledTimes(2);
        update(savingStarts);

        expect(screen.queryByRole('alert')).toBeNull();
      });

      it('does not show the error again when the form opens again', () => {
        const { container, update } = renderForm();
        saveNewAddress(container, update);
        update(savingFails);

        cancel();
        edit();

        expect(screen.queryByRole('alert')).toBeNull();
        expect(emailInput(container).value).toBe('ppr@aerodrome.ch');
      });
    });

    describe('results it did not save', () => {
      it('does not confirm a save left over from before (another visit, the privacy tab)', () => {
        renderSettings({ saved: true });
        expect(screen.getByRole('status')).toBeEmptyDOMElement();
      });

      it('does not show a failure left over from before', () => {
        renderForm({ saveFailed: true });
        expect(screen.queryByRole('alert')).toBeNull();
      });

      it('does not confirm a save started elsewhere', () => {
        const { update } = renderSettings();

        update(savingStarts);
        update(savingSucceeds({ retentionDays: 30 }));

        expect(screen.getByRole('status')).toBeEmptyDOMElement();
      });

      it('stays open when a save started before it opened ends', () => {
        const { container, update } = renderSettings({ saving: true });
        edit();

        update(savingSucceeds({ retentionDays: 30 }));

        expect(emailInput(container)).not.toBeNull();
        cancel();
        expect(screen.getByRole('status')).toBeEmptyDOMElement();
      });
    });
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

  describe('notification address', () => {
    it('shows the current address', () => {
      const { container } = renderForm();
      expect(emailInput(container).value).toBe('ppr@aerodrome.ch');
      expect(screen.queryByText('ppr.settings.noAdminEmail')).toBeNull();
    });

    it('warns when no address is set while answering manually', () => {
      const { container } = renderForm({ adminEmail: null });
      expect(byCy(container, 'ppr-settings-form')).toContainElement(screen.getByText('ppr.settings.noAdminEmail'));
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
    // The form opens in the place of the summary: the second click of a
    // double click on "Bearbeiten" can land on the answer modes
    it('stays as it is after a double click on "Bearbeiten"', () => {
      const { container } = renderSettings();

      fireEvent.click(screen.getByText('common.edit'), { detail: 1 });
      fireEvent.click(byCy(container, 'answerMode-automatic'), { detail: 2 });

      expect(byCy(container, 'pilotInfo')).toBeNull();
      expect(saveButton(container)).toBeDisabled();
    });

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
      const { container } = renderForm();
      expect(byCy(container, 'ppr-closures')).toHaveTextContent('ppr.settings.noClosures');
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

    it('removes one closure with a double click, not also the next one moving up under the pointer', () => {
      const event = { from: '2099-05-01', to: '2099-05-01', reason: 'Fly-in' };
      const { container, props } = renderForm({ closures: [runwayWorks, event] });

      fireEvent.click(byCy(container, 'ppr-closure-0-remove'), { detail: 1 });
      fireEvent.click(byCy(container, 'ppr-closure-0-remove'), { detail: 2 });
      save();

      expect(savedSettings(props).closures).toEqual([event]);
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
