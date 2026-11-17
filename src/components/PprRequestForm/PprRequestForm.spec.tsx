import React from 'react';
import { renderWithTheme, withTheme, screen, fireEvent } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, options) => options ? `${key}:${JSON.stringify(options)}` : key }),
  Trans: ({ i18nKey }) => i18nKey,
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
  aerodrome: { name: 'Langenthal' },
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
    dismissPprSubmitFailure: jest.fn(),
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
        lastname: 'Muster', firstname: 'Max', immatriculation: 'HBZZZ', aircraftType: 'R44', mtow: 1134,
        aircraftCategory: 'Flugzeug', plannedDate: inDays(10), plannedTime: '10:30',
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

  describe('closures', () => {
    // Days of one month, some weeks ahead
    const month = inDays(40).slice(0, 7);
    const day = (dayOfMonth: number) => `${month}-${String(dayOfMonth).padStart(2, '0')}`;
    const closures = [{ from: day(10), to: day(12), reason: 'Runway works' }];
    // validate() uses i18n directly, not the mocked useTranslation
    const blockedMessage = () => i18n.t('ppr.validation.plannedDateBlocked', { reason: 'Runway works' });

    const filled = (plannedDate: string) => ({
      lastname: 'Muster', firstname: 'Max', immatriculation: 'HBKOF', aircraftType: 'DR40', mtow: 1000,
      aircraftCategory: 'Flugzeug', plannedDate, plannedTime: '10:30', flightType: 'private',
    });

    const chooseDay = (container: HTMLElement, date: string) => {
      fireEvent.click(field(container, 'plannedDate'));
      fireEvent.click(container.querySelector(`td[data-day="${date}"] button`)!);
    };

    it('marks their days in the calendar', () => {
      const { container } = renderForm({ initialValues: filled(day(20)), closures });

      fireEvent.click(field(container, 'plannedDate'));

      expect(container.querySelector(`td[data-day="${day(11)}"]`)).toHaveClass('blocked-day');
      expect(container.querySelector(`td[data-day="${day(13)}"]`)).not.toHaveClass('blocked-day');
      expect(container.querySelector('[data-cy="date-picker-blocked"]')!.textContent).toContain('Runway works');
    });

    it('says right away that a chosen day is blocked, and sends no request for it', () => {
      const { container, props } = renderForm({ initialValues: filled(day(20)), closures });
      expect(container.textContent).not.toContain(blockedMessage());

      chooseDay(container, day(11));

      expect(field(container, 'plannedDate').textContent).toBe(`11.${month.slice(5)}.${month.slice(0, 4)}`);
      expect(container.textContent).toContain(blockedMessage());
      fireEvent.click(screen.getByText('ppr.submit'));
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it('sends the request for another day', () => {
      const { container, props } = renderForm({ initialValues: filled(day(11)), closures });

      chooseDay(container, day(13));
      fireEvent.click(screen.getByText('ppr.submit'));

      expect(container.textContent).not.toContain(blockedMessage());
      expect(props.onSubmit).toHaveBeenCalledTimes(1);
      expect(props.onSubmit.mock.calls[0][0].plannedDate).toBe(day(13));
    });

    it('checks the date again when the closures come after it was chosen', () => {
      const { container, props, rerender } = renderForm({ initialValues: filled(day(11)) });
      chooseDay(container, day(11));
      expect(container.textContent).not.toContain(blockedMessage());

      rerender(withTheme(<PprRequestForm {...props} closures={closures}/>));

      expect(container.textContent).toContain(blockedMessage());
      fireEvent.click(screen.getByText('ppr.submit'));
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it('refuses their days without login too', () => {
      const { props } = renderForm({
        initialValues: { ...filled(day(12)), email: 'max@example.com' },
        closures,
        withoutLogin: true,
      });

      fireEvent.click(screen.getByText('ppr.submit'));

      expect(props.onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(blockedMessage())).toBeTruthy();
    });
  });

  // As when recording the movement: automatic answers go by them
  it('does not submit without the type and the MTOW of the aircraft', () => {
    const { container, props } = renderForm({
      initialValues: {
        lastname: 'Muster', firstname: 'Max', immatriculation: 'HBKOF', aircraftCategory: 'Flugzeug',
        plannedDate: inDays(10), plannedTime: '10:30', flightType: 'private',
      },
    });

    fireEvent.click(screen.getByText('ppr.submit'));

    expect(props.onSubmit).not.toHaveBeenCalled();
    // validate() uses i18n directly, not the mocked useTranslation
    expect(container.textContent).toContain(i18n.t('validate.aircraftType'));
    expect(container.textContent).toContain(i18n.t('validate.mtow'));
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

  it('keeps the form open while the request is being sent, so the pilot sees how it went', () => {
    window.history.pushState({}, '', '/ppr/new');
    renderForm({ submitting: true });

    const cancel = screen.getByText('wizard.cancel').closest('button') as HTMLButtonElement;
    expect(cancel).toHaveAttribute('disabled');
    fireEvent.click(cancel);
    expect(window.location.pathname).toBe('/ppr/new');
  });

  describe('after sending', () => {
    it('says the request waits for an answer', () => {
      renderForm({ submitted: true, result: { key: 'req-1', status: 'pending' } });

      expect(screen.getByText('ppr.submitSuccess')).toBeTruthy();
      expect(screen.getByText('ppr.submitPending')).toBeTruthy();
    });

    it('shows an automatic approval with the information for pilots', () => {
      const { container } = renderForm({
        submitted: true,
        result: { key: 'req-1', status: 'approved', reviewRemarks: 'Runway 05/23, landing fee CHF 20' },
      });

      expect(screen.getByText('ppr.submitApproved')).toBeTruthy();
      expect(field(container, 'ppr-submit-remarks').textContent).toBe('ppr.pilotInfoRunway 05/23, landing fee CHF 20');
      expect(screen.getByText('ppr.checkBeforeFlight')).toBeTruthy();
      expect(screen.queryByText('ppr.submitPending')).toBeNull();
    });

    it('shows a rejection with its reason', () => {
      const { container } = renderForm({
        submitted: true,
        result: { key: 'req-1', status: 'rejected', reviewRemarks: 'Runway works' },
      });

      expect(screen.getByText('ppr.submitRejected')).toBeTruthy();
      expect(field(container, 'ppr-submit-remarks').textContent).toBe('ppr.reasonRunway works');
      expect(screen.queryByText('ppr.checkBeforeFlight')).toBeNull();
    });

    it('shows an approval without remarks', () => {
      const { container } = renderForm({ submitted: true, result: { key: 'req-1', status: 'approved' } });

      expect(screen.getByText('ppr.submitApproved')).toBeTruthy();
      expect(field(container, 'ppr-submit-remarks')).toBeNull();
    });

    it('goes back to the start page when the dialog is closed', () => {
      const { props } = renderForm({ submitted: true, result: { key: 'req-1', status: 'approved' } });

      fireEvent.click(screen.getByText('common.close'));

      expect(props.confirmPprSubmitSuccess).toHaveBeenCalledTimes(1);
    });
  });

  describe('when sending fails', () => {
    it('tells that the request could not be sent', () => {
      renderForm({ commitFailed: true });
      expect(screen.getByText('ppr.submitFailed')).toBeTruthy();
    });

    it('tells about a refusal for too many requests', () => {
      renderForm({ commitFailed: true, rateLimited: true });
      expect(screen.getByText('ppr.withoutLogin.tooManyRequests')).toBeTruthy();
      expect(screen.queryByText('ppr.submitFailed')).toBeNull();
    });

    // The form stays open with what it has, e.g. the closures: a reset of
    // the page would drop them
    it('closes the notice without resetting the page', () => {
      const { props } = renderForm({ commitFailed: true });

      fireEvent.click(screen.getByText('common.close'));

      expect(props.dismissPprSubmitFailure).toHaveBeenCalledTimes(1);
      expect(props.resetPprForm).not.toHaveBeenCalled();
    });
  });

  describe('without login', () => {
    const goTo = (path: string) => window.history.pushState({}, '', path);

    afterEach(() => {
      window.history.replaceState({}, '', '/');
    });

    // A guest session or a login without an email address: logged in, so
    // the aircraft list can be offered
    const renderGuestForm = (props = {}) => renderForm({ withoutLogin: true, ...props });

    it('names the aerodrome in the heading, as the side header is hidden on phones', () => {
      renderGuestForm();
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('ppr.requestFor:{"aerodrome":"Langenthal"}');
    });

    it('asks for the email address the receipt and the answer go to', () => {
      const { container } = renderGuestForm();
      expect(field(container, 'email').getAttribute('type')).toBe('email');
      expect(screen.getByText('ppr.withoutLogin.emailHelp')).toBeTruthy();
    });

    it('does not ask for an email address with a login', () => {
      const { container } = renderForm();
      expect(field(container, 'email')).toBeNull();
    });

    it('submits the entered values with the email address', () => {
      const plannedDate = inDays(10);
      const { container, props } = renderGuestForm({ initialValues: { plannedDate, plannedTime: '10:30' } });

      fireEvent.change(field(container, 'lastname'), { target: { value: 'Muster' } });
      fireEvent.change(field(container, 'firstname'), { target: { value: 'Max' } });
      fireEvent.change(field(container, 'email'), { target: { value: 'max@example.com' } });
      fireEvent.click(screen.getByText('pick HBKOF'));
      fireEvent.click(field(container, 'flightType-private'));
      fireEvent.click(screen.getByText('ppr.submit'));

      expect(props.onSubmit).toHaveBeenCalledTimes(1);
      expect(props.onSubmit.mock.calls[0][0]).toMatchObject({
        lastname: 'Muster',
        firstname: 'Max',
        email: 'max@example.com',
        immatriculation: 'HBKOF',
      });
    });

    it('does not submit without a valid email address', () => {
      const { container, props } = renderGuestForm({
        initialValues: {
          lastname: 'Muster', firstname: 'Max', email: 'max@example', immatriculation: 'HBKOF',
          aircraftCategory: 'Flugzeug', plannedDate: inDays(10), plannedTime: '10:30', flightType: 'private',
        },
      });

      fireEvent.click(screen.getByText('ppr.submit'));

      expect(props.onSubmit).not.toHaveBeenCalled();
      // validate() uses i18n directly, not the mocked useTranslation
      expect(container.textContent).toContain(i18n.t('ppr.withoutLogin.invalidEmail'));
    });

    it('offers guest sessions the aircraft list', () => {
      renderGuestForm();
      expect(screen.getByText('pick HBKOF')).toBeTruthy();
    });

    // Accepted with the login, guest sessions too
    it('asks nothing about privacy', () => {
      renderGuestForm();
      expect(screen.queryByText(/privacy|Datenschutz/i)).toBeNull();
    });

    it('takes guest sessions back to the start page on cancel', () => {
      goTo('/ppr/new');
      renderGuestForm();

      fireEvent.click(screen.getByText('wizard.cancel'));

      expect(window.location.pathname).toBe('/');
    });

    describe('after sending', () => {
      const pending = { key: '-Nabc', status: 'pending', statusToken: 'token_1-x' };
      const initialValues = { email: 'max@example.com' };

      it('tells where the receipt went and leads to the status page', () => {
        goTo('/ppr/new');
        const { props } = renderGuestForm({ submitted: true, result: pending, initialValues });

        expect(screen.getByText('ppr.submitSuccess')).toBeTruthy();
        expect(screen.getByText('ppr.submitPending')).toBeTruthy();
        expect(screen.getByText('ppr.withoutLogin.receiptSent:{"email":"max@example.com"}')).toBeTruthy();
        expect(screen.getByText('ppr.withoutLogin.wrongAddress')).toBeTruthy();

        fireEvent.click(screen.getByText('ppr.withoutLogin.showStatus'));

        expect(window.location.pathname).toBe('/ppr/status/-Nabc/token_1-x');
        expect(props.confirmPprSubmitSuccess).not.toHaveBeenCalled();
      });

      it('tells where an answer on submission went, with the answer', () => {
        const { container } = renderGuestForm({
          submitted: true,
          result: { ...pending, status: 'approved', reviewRemarks: 'Runway 05/23' },
          initialValues,
        });

        expect(screen.getByText('ppr.submitApproved')).toBeTruthy();
        expect(field(container, 'ppr-submit-remarks').textContent).toBe('ppr.pilotInfoRunway 05/23');
        expect(screen.getByText('ppr.checkBeforeFlight')).toBeTruthy();
        expect(screen.getByText('ppr.withoutLogin.answerSent:{"email":"max@example.com"}')).toBeTruthy();
        expect(screen.queryByText('ppr.answerByEmail')).toBeNull();
        expect(screen.queryByText(/ppr\.withoutLogin\.receiptSent/)).toBeNull();
        expect(screen.getByText('ppr.withoutLogin.showStatus')).toBeTruthy();
      });

      it('names the address the request was sent with, not the one in the field now', () => {
        renderGuestForm({
          submitted: true,
          result: { ...pending, email: 'max@example.com' },
          initialValues: { email: 'moritz@example.com' },
        });

        expect(screen.getByText('ppr.withoutLogin.receiptSent:{"email":"max@example.com"}')).toBeTruthy();
      });

      it('asks to open the status when the receipt could not be sent, and promises no email', () => {
        renderGuestForm({ submitted: true, result: { ...pending, emailSent: false }, initialValues });

        expect(screen.getByText('ppr.withoutLogin.receiptFailed:{"email":"max@example.com"}')).toBeTruthy();
        expect(screen.queryByText('ppr.submitPending')).toBeNull();
        expect(screen.queryByText(/ppr\.withoutLogin\.receiptSent/)).toBeNull();
        expect(screen.getByText('ppr.withoutLogin.wrongAddress')).toBeTruthy();
        expect(screen.getByText('ppr.withoutLogin.showStatus')).toBeTruthy();
      });

      it.each([
        ['approved', { ...pending, status: 'approved' }],
        ['rejected', { ...pending, status: 'rejected', reviewRemarks: 'Geschlossen' }],
      ])('asks to open the status when the answer to a request %s on submission could not be sent', (name, result) => {
        renderGuestForm({ submitted: true, result: { ...result, emailSent: false }, initialValues });

        expect(screen.getByText('ppr.withoutLogin.answerFailed:{"email":"max@example.com"}')).toBeTruthy();
        expect(screen.queryByText(/ppr\.withoutLogin\.answerSent/)).toBeNull();
        expect(screen.getByText('ppr.withoutLogin.showStatus')).toBeTruthy();
      });

      it('keeps promising the answer by email to a login, whatever the server says', () => {
        renderForm({ submitted: true, result: { key: 'req-1', status: 'pending', emailSent: false } });
        expect(screen.getByText('ppr.submitPending')).toBeTruthy();
      });

      it('tells that the email was sent when the server does not say', () => {
        renderGuestForm({ submitted: true, result: { ...pending, emailSent: true }, initialValues });
        expect(screen.getByText('ppr.withoutLogin.receiptSent:{"email":"max@example.com"}')).toBeTruthy();
      });

      it('gives no hint about a wrong address for an answered request, which can\'t be withdrawn', () => {
        renderGuestForm({ submitted: true, result: { ...pending, status: 'approved' }, initialValues });
        expect(screen.queryByText('ppr.withoutLogin.wrongAddress')).toBeNull();
      });

      it('takes guest sessions back to the start page when the dialog is closed', () => {
        goTo('/ppr/new');
        const { props } = renderGuestForm({ submitted: true, result: pending, initialValues });

        fireEvent.click(screen.getByText('common.close'));

        expect(window.location.pathname).toBe('/');
        expect(props.confirmPprSubmitSuccess).not.toHaveBeenCalled();
      });

      it('offers no status page without the token of its link', () => {
        renderGuestForm({ submitted: true, result: { key: '-Nabc', status: 'pending' }, initialValues });

        expect(screen.queryByText('ppr.withoutLogin.showStatus')).toBeNull();
        expect(screen.getByText('common.close')).toBeTruthy();
      });
    });
  });
});
