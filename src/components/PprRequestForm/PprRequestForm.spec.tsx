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
        <button type="button" onClick={() => onChange({ key: 'HBKOF', type: 'DR40', mtow: 1000 })}>
          pick HBKOF
        </button>
        <button type="button" onClick={() => onChange({ key: 'HBXYZ' })}>type HBXYZ</button>
      </div>
    );
  };
});

import i18n from '../../i18n';
import PprRequestForm from './PprRequestForm';

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

describe('PprRequestForm', () => {
  beforeEach(() => {
    // Arrays in __CONF__ arrive as index-keyed objects (projects packinize)
    (global as any).__CONF__ = { enabledFlightTypes: { 0: 'private', 1: 'instruction' } };
  });

  afterEach(() => {
    delete (global as any).__CONF__;
  });

  it('offers the enabled flight types from the compiled config as a single select', () => {
    const { container } = renderForm();
    expect(field(container, 'flightType-private').textContent).toContain('flightTypes.private');
    expect(field(container, 'flightType-instruction').textContent).toContain('flightTypes.instruction');
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

  it('fills in type and MTOW from the selected aircraft', () => {
    const { container } = renderForm();

    fireEvent.click(screen.getByText('pick HBKOF'));
    expect(field(container, 'immatriculation').textContent).toBe('HBKOF');
    expect(field(container, 'aircraftType').value).toBe('DR40');
    expect(field(container, 'mtow').value).toBe('1000');

    // an aircraft that is not in the list clears them again
    fireEvent.click(screen.getByText('type HBXYZ'));
    expect(field(container, 'immatriculation').textContent).toBe('HBXYZ');
    expect(field(container, 'aircraftType').value).toBe('');
    expect(field(container, 'mtow').value).toBe('');
  });

  it('offers the profile aircraft as shortcuts when there are several', () => {
    const profileAircrafts = [
      { immatriculation: 'HBKOF', aircraftType: 'DR40', mtow: 1000, aircraftCategory: 'Flugzeug' },
      { immatriculation: 'HBPOS', aircraftType: 'PA28', mtow: 1100, aircraftCategory: 'Flugzeug' },
    ];
    const { container } = renderForm({ profileAircrafts });

    fireEvent.click(screen.getByRole('button', { name: 'HBPOS' }));

    expect(field(container, 'immatriculation').textContent).toBe('HBPOS');
    expect(field(container, 'aircraftType').value).toBe('PA28');
    expect(field(container, 'mtow').value).toBe('1100');
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
      plannedDate,
      plannedTime: '10:30',
      flightType: 'private',
    });
  });

  it('does not submit a planned date in the past', () => {
    const { container, props } = renderForm({
      initialValues: { lastname: 'Muster', firstname: 'Max', immatriculation: 'HBKOF', plannedDate: inDays(-2), plannedTime: '10:30', flightType: 'private' },
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
