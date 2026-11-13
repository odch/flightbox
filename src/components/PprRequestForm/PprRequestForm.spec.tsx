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

jest.mock('../ModalDialog', () => {
  const React = require('react');
  return function MockModalDialog({ content }) {
    return <div data-testid="modal-dialog">{content}</div>;
  };
});

// The connected dropdown loads the aircraft list; here it offers one aircraft
jest.mock('../../containers/AircraftDropdownContainer', () => {
  const React = require('react');
  return function MockAircraftDropdown({ value, onChange }) {
    return (
      <div>
        <span data-cy="immatriculation">{value}</span>
        <button type="button" onClick={() => onChange({ key: 'HBKOF', type: 'DR40', mtow: 1000, category: 'Flugzeug' })}>
          pick HBKOF
        </button>
        <button type="button" onClick={() => onChange({ key: 'HBXYZ' })}>type HBXYZ</button>
      </div>
    );
  };
});

jest.mock('../AircraftCategoryDropdown', () => {
  const React = require('react');
  return function MockAircraftCategoryDropdown({ value, onChange }) {
    return (
      <select data-cy="aircraftCategory" value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">-</option>
        <option value="Flugzeug">Flugzeug</option>
        <option value="Segelflugzeug">Segelflugzeug</option>
        <option value="Hubschrauber">Hubschrauber</option>
      </select>
    );
  };
});

import i18n from '../../i18n';

// The flight types are read from __CONF__ when util/flightTypes is loaded, so
// it is set before the form is. Arrays in __CONF__ arrive as index-keyed
// objects (packinize in projects/index.js).
(global as any).__CONF__ = {
  enabledFlightTypes: {
    0: 'private',
    1: 'instruction',
    2: 'aerotow',
    3: 'glider_private_aerotow',
    4: 'glider_private_winch',
  },
};
const PprRequestForm = require('./PprRequestForm').default;

const inDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const renderForm = (props = {}) => {
  const allProps = {
    initPprForm: jest.fn(),
    resetPprForm: jest.fn(),
    confirmPprSubmitSuccess: jest.fn(),
    onSubmit: jest.fn(),
    initialValues: {},
    submitting: false,
    submitted: false,
    commitFailed: false,
    ...props,
  };
  return { ...renderWithTheme(<PprRequestForm {...allProps} />), props: allProps };
};

const field = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-cy="${name}"]`) as HTMLInputElement;

const offeredFlightTypes = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-cy^="flightType-"]'))
    .map(el => el.getAttribute('data-cy')!.replace('flightType-', ''))
    .filter(type => type !== 'categoryFirst');

describe('PprRequestForm', () => {
  it('asks for the aircraft category before offering flight types', () => {
    const { container } = renderForm();
    expect(offeredFlightTypes(container)).toEqual([]);
    expect(field(container, 'flightType-categoryFirst').textContent).toBe('ppr.chooseCategoryFirst');
  });

  it('offers the enabled flight types that fit the category, as the arrival wizard does', () => {
    const { container } = renderForm({ initialValues: { aircraftCategory: 'Flugzeug' } });
    expect(offeredFlightTypes(container)).toEqual(['private', 'instruction', 'aerotow']);
    expect(field(container, 'flightType-categoryFirst')).toBeNull();
  });

  it('offers the glider flight types for a glider', () => {
    const { container } = renderForm({ initialValues: { aircraftCategory: 'Segelflugzeug' } });
    expect(offeredFlightTypes(container)).toEqual(['glider_private_aerotow', 'glider_private_winch']);
  });

  it('clears a chosen flight type that does not fit a new category', () => {
    const { container, props } = renderForm({
      initialValues: {
        lastname: 'Muster', firstname: 'Max', immatriculation: 'HBKOF', aircraftCategory: 'Flugzeug',
        plannedDate: inDays(10), plannedTime: '10:30',
      },
    });
    fireEvent.click(field(container, 'flightType-private'));

    fireEvent.change(field(container, 'aircraftCategory'), { target: { value: 'Segelflugzeug' } });
    fireEvent.click(screen.getByText('ppr.submit'));

    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(offeredFlightTypes(container)).toEqual(['glider_private_aerotow', 'glider_private_winch']);
  });

  it('keeps a chosen flight type that also fits the new category', () => {
    const { container, props } = renderForm({
      initialValues: {
        lastname: 'Muster', firstname: 'Max', immatriculation: 'HBZZZ', aircraftCategory: 'Flugzeug',
        plannedDate: inDays(10), plannedTime: '10:30',
      },
    });
    fireEvent.click(field(container, 'flightType-private'));

    fireEvent.change(field(container, 'aircraftCategory'), { target: { value: 'Hubschrauber' } });
    expect(offeredFlightTypes(container)).toEqual(['private', 'instruction']);

    fireEvent.click(screen.getByText('ppr.submit'));
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onSubmit.mock.calls[0][0]).toMatchObject({ aircraftCategory: 'Hubschrauber', flightType: 'private' });
  });

  it('uses the date and time fields of the movement wizards', () => {
    const { container } = renderForm({ initialValues: { plannedDate: '2099-04-15', plannedTime: '10:30' } });
    // DatePicker shows the formatted date and opens a calendar on click
    expect(field(container, 'plannedDate').textContent).toBe('15.04.2099');
    expect(container.querySelector('input[type="date"]')).toBeNull();
    expect(container.querySelector('input[type="time"]')).toBeNull();
    // TimeField with hours and minutes blocks
    expect(field(container, 'plannedTime-hours-input').value).toBe('10');
    expect(field(container, 'plannedTime-minutes-input').value).toBe('30');
  });

  it('keeps the input types for MTOW and phone', () => {
    const { container } = renderForm();
    expect(field(container, 'mtow').getAttribute('type')).toBe('number');
    expect(field(container, 'phone').getAttribute('type')).toBe('tel');
  });

  it('fills in type, MTOW and category from the selected aircraft', () => {
    const { container } = renderForm();

    fireEvent.click(screen.getByText('pick HBKOF'));
    expect(field(container, 'immatriculation').textContent).toBe('HBKOF');
    expect(field(container, 'aircraftType').value).toBe('DR40');
    expect(field(container, 'mtow').value).toBe('1000');
    expect(field(container, 'aircraftCategory').value).toBe('Flugzeug');
    expect(offeredFlightTypes(container)).toEqual(['private', 'instruction', 'aerotow']);

    // an aircraft that is not in the list clears them again
    fireEvent.click(screen.getByText('type HBXYZ'));
    expect(field(container, 'immatriculation').textContent).toBe('HBXYZ');
    expect(field(container, 'aircraftType').value).toBe('');
    expect(field(container, 'mtow').value).toBe('');
    expect(field(container, 'aircraftCategory').value).toBe('');
    expect(offeredFlightTypes(container)).toEqual([]);
  });

  it('offers the profile aircraft as shortcuts when there are several', () => {
    const profileAircrafts = [
      { immatriculation: 'HBKOF', aircraftType: 'DR40', mtow: 1000, aircraftCategory: 'Flugzeug' },
      { immatriculation: 'HB1234', aircraftType: 'ASK 21', mtow: 600, aircraftCategory: 'Segelflugzeug' },
    ];
    const { container } = renderForm({ profileAircrafts });

    fireEvent.click(screen.getByRole('button', { name: 'HB1234' }));

    expect(field(container, 'immatriculation').textContent).toBe('HB1234');
    expect(field(container, 'aircraftType').value).toBe('ASK 21');
    expect(field(container, 'mtow').value).toBe('600');
    expect(field(container, 'aircraftCategory').value).toBe('Segelflugzeug');
    expect(offeredFlightTypes(container)).toEqual(['glider_private_aerotow', 'glider_private_winch']);
  });

  it('shows no shortcuts for a single profile aircraft', () => {
    renderForm({
      profileAircrafts: [{ immatriculation: 'HBKOF', aircraftType: 'DR40', mtow: 1000, aircraftCategory: 'Flugzeug' }],
    });
    expect(screen.queryByRole('button', { name: 'HBKOF' })).toBeNull();
  });

  it('initializes on mount and resets on unmount', () => {
    const { unmount, props } = renderForm();
    expect(props.initPprForm).toHaveBeenCalledTimes(1);
    unmount();
    expect(props.resetPprForm).toHaveBeenCalledTimes(1);
  });

  it('submits the entered values', () => {
    const plannedDate = inDays(10);
    const { container, props } = renderForm({ initialValues: { plannedDate, plannedTime: '10:30' } });

    fireEvent.change(field(container, 'lastname'), { target: { value: 'Muster' } });
    fireEvent.change(field(container, 'firstname'), { target: { value: 'Max' } });
    fireEvent.click(screen.getByText('pick HBKOF'));
    fireEvent.click(field(container, 'flightType-private'));

    fireEvent.click(screen.getByText('ppr.submit'));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onSubmit.mock.calls[0][0]).toEqual({
      lastname: 'Muster',
      firstname: 'Max',
      immatriculation: 'HBKOF',
      aircraftType: 'DR40',
      mtow: 1000,
      aircraftCategory: 'Flugzeug',
      plannedDate,
      plannedTime: '10:30',
      flightType: 'private',
    });
  });

  it('does not submit a planned date in the past', () => {
    const { container, props } = renderForm({
      initialValues: {
        lastname: 'Muster', firstname: 'Max', immatriculation: 'HBKOF', aircraftCategory: 'Flugzeug',
        plannedDate: inDays(-2), plannedTime: '10:30', flightType: 'private',
      },
    });

    fireEvent.click(screen.getByText('ppr.submit'));

    expect(props.onSubmit).not.toHaveBeenCalled();
    // validate() uses i18n directly, not the mocked useTranslation
    expect(container.textContent).toContain(i18n.t('ppr.validation.plannedDatePast'));
  });

  it('goes back to the start page on cancel', () => {
    window.history.pushState({}, '', '/ppr/new');
    renderForm();

    fireEvent.click(screen.getByText('wizard.cancel'));

    expect(window.location.pathname).toBe('/');
  });

  it('disables the submit button while the request is being sent', () => {
    const { container } = renderForm({ submitting: true });
    expect(field(container, 'ppr-submit').hasAttribute('disabled')).toBe(true);
  });
});
