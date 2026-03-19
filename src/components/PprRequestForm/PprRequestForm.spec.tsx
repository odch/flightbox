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

import PprRequestForm from './PprRequestForm';

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

  it('offers the enabled flight types from the compiled config', () => {
    renderForm();
    expect(screen.getByRole('option', { name: 'flightTypes.private' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'flightTypes.instruction' })).toBeTruthy();
  });

  it('keeps the input types, so date and time get native pickers', () => {
    const { container } = renderForm();
    expect(field(container, 'plannedDate').getAttribute('type')).toBe('date');
    expect(field(container, 'plannedTime').getAttribute('type')).toBe('time');
    expect(field(container, 'mtow').getAttribute('type')).toBe('number');
    expect(field(container, 'phone').getAttribute('type')).toBe('tel');
    expect(field(container, 'plannedDate').getAttribute('name')).toBe('plannedDate');
  });

  it('initializes on mount and resets on unmount', () => {
    const { unmount, props } = renderForm();
    expect(props.initPprForm).toHaveBeenCalledTimes(1);
    unmount();
    expect(props.resetPprForm).toHaveBeenCalledTimes(1);
  });

  it('submits the entered values', () => {
    const { container, props } = renderForm();
    const values = {
      firstname: 'Max',
      lastname: 'Muster',
      immatriculation: 'HBKOF',
      plannedDate: '2099-04-15',
      plannedTime: '10:30',
      flightType: 'private',
    };
    Object.entries(values).forEach(([name, value]) => {
      fireEvent.change(field(container, name), { target: { value } });
    });

    fireEvent.click(screen.getByText('ppr.submit'));

    expect(props.onSubmit).toHaveBeenCalledTimes(1);
    expect(props.onSubmit.mock.calls[0][0]).toEqual(values);
  });

  it('disables the submit button while the request is being sent', () => {
    const { container } = renderForm({ submitting: true });
    expect(field(container, 'ppr-submit').hasAttribute('disabled')).toBe(true);
  });
});
