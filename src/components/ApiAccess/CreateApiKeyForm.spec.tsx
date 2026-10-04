import React from 'react';
import '../../i18n';
import {renderWithTheme, screen, fireEvent, act} from '../../../test/renderWithTheme';
import CreateApiKeyForm, {toPayload, validate} from './CreateApiKeyForm';
import {toggleScope} from './scopes';

const BASE = 'reports:airstat';
const INTERNAL = 'reports:airstat:internal';
const BASE_LABEL = 'Airstat-Report (BAZL)';
const INTERNAL_LABEL = 'Airstat-Report mit zusätzlichen Informationen (Namen, E-Mail-Adressen, Bemerkungen, Rechnungsempfänger)';
const CONFIRM_LABEL = 'Mir ist bewusst, dass dieser Schlüssel Personendaten liefert und sicher aufbewahrt werden muss.';

const renderForm = (props: Partial<React.ComponentProps<typeof CreateApiKeyForm>> = {}) => {
  const onCreate = jest.fn();
  const onKeyCreated = jest.fn(() => true);
  const utils = renderWithTheme(
    <CreateApiKeyForm
      availableScopes={[BASE, INTERNAL]}
      creating={false}
      createError={null}
      onCreate={onCreate}
      onKeyCreated={onKeyCreated}
      {...props}
    />
  );
  return {...utils, onCreate, onKeyCreated};
};

const nameInput = () => screen.getByLabelText('Name') as HTMLInputElement;
const checkbox = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
const submit = () => fireEvent.click(screen.getByRole('button', {name: /Schlüssel erstellen/}));

describe('CreateApiKeyForm', () => {
  it('requires a name and at least one permission', () => {
    const {onCreate} = renderForm();
    submit();
    expect(screen.getByText('Bitte geben Sie einen Namen ein.')).toBeInTheDocument();
    expect(screen.getByText('Bitte wählen Sie mindestens eine Berechtigung aus.')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('rejects a blank name and a name longer than 60 characters', () => {
    const {onCreate} = renderForm();
    fireEvent.click(checkbox(BASE_LABEL));

    fireEvent.change(nameInput(), {target: {value: '   '}});
    submit();
    expect(screen.getByText('Bitte geben Sie einen Namen ein.')).toBeInTheDocument();

    fireEvent.change(nameInput(), {target: {value: 'x'.repeat(61)}});
    expect(screen.getByText('Der Name darf höchstens 60 Zeichen lang sein.')).toBeInTheDocument();
    submit();
    expect(onCreate).not.toHaveBeenCalled();

    fireEvent.change(nameInput(), {target: {value: 'x'.repeat(60)}});
    submit();
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('sends the base scope with the default expiry of 12 months', () => {
    const {onCreate} = renderForm();
    fireEvent.change(nameInput(), {target: {value: '  Statistikprogramm Hans  '}});
    fireEvent.click(checkbox(BASE_LABEL));
    submit();

    expect(onCreate).toHaveBeenCalledWith({
      name: 'Statistikprogramm Hans',
      scopes: [BASE],
      expiresInMonths: 12,
      confirmPersonalData: false,
    }, expect.any(Function));
  });

  it('offers 3, 6, 12, 24 months and unlimited, sending null for unlimited', () => {
    const {onCreate} = renderForm();
    const select = screen.getByLabelText('Gültigkeit') as HTMLSelectElement;
    expect(Array.from(select.options).map(o => o.textContent)).toEqual([
      '3 Monate', '6 Monate', '12 Monate', '24 Monate', 'Unbegrenzt',
    ]);
    expect(select.value).toBe('12');

    fireEvent.change(nameInput(), {target: {value: 'Test'}});
    fireEvent.click(checkbox(BASE_LABEL));
    fireEvent.change(select, {target: {value: 'unlimited'}});
    submit();
    expect(onCreate.mock.calls[0][0].expiresInMonths).toBeNull();

    fireEvent.change(select, {target: {value: '24'}});
    submit();
    expect(onCreate.mock.calls[1][0].expiresInMonths).toBe(24);
  });

  it('enables the internal permission only together with the base permission', () => {
    renderForm();
    expect(checkbox(INTERNAL_LABEL)).toBeDisabled();
    expect(screen.getByText(`Nur zusammen mit '${BASE_LABEL}' möglich.`)).toBeInTheDocument();

    fireEvent.click(checkbox(BASE_LABEL));
    expect(checkbox(INTERNAL_LABEL)).not.toBeDisabled();

    fireEvent.click(checkbox(INTERNAL_LABEL));
    expect(checkbox(INTERNAL_LABEL)).toBeChecked();

    // Unchecking the base permission drops the internal one as well.
    fireEvent.click(checkbox(BASE_LABEL));
    expect(checkbox(INTERNAL_LABEL)).not.toBeChecked();
    expect(checkbox(INTERNAL_LABEL)).toBeDisabled();
    expect(screen.queryByLabelText(CONFIRM_LABEL)).toBeNull();
  });

  it('requires the personal data confirmation for the internal permission', () => {
    const {onCreate} = renderForm();
    expect(screen.queryByLabelText(CONFIRM_LABEL)).toBeNull();

    fireEvent.change(nameInput(), {target: {value: 'Statistikprogramm'}});
    fireEvent.click(checkbox(BASE_LABEL));
    fireEvent.click(checkbox(INTERNAL_LABEL));
    expect(screen.getByLabelText(CONFIRM_LABEL)).not.toBeChecked();

    submit();
    expect(screen.getByText('Bitte bestätigen Sie, dass Ihnen dies bewusst ist.')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText(CONFIRM_LABEL));
    submit();
    expect(onCreate).toHaveBeenCalledWith({
      name: 'Statistikprogramm',
      scopes: [BASE, INTERNAL],
      expiresInMonths: 12,
      confirmPersonalData: true,
    }, expect.any(Function));
  });

  it('resets the confirmation when the internal permission is unchecked', () => {
    const {onCreate} = renderForm();
    fireEvent.change(nameInput(), {target: {value: 'Test'}});
    fireEvent.click(checkbox(BASE_LABEL));
    fireEvent.click(checkbox(INTERNAL_LABEL));
    fireEvent.click(screen.getByLabelText(CONFIRM_LABEL));
    fireEvent.click(checkbox(INTERNAL_LABEL));
    submit();
    expect(onCreate.mock.calls[0][0]).toEqual({
      name: 'Test',
      scopes: [BASE],
      expiresInMonths: 12,
      confirmPersonalData: false,
    });

    fireEvent.click(checkbox(INTERNAL_LABEL));
    expect(screen.getByLabelText(CONFIRM_LABEL)).not.toBeChecked();
  });

  it('only offers the available scopes', () => {
    renderForm({availableScopes: [BASE]});
    expect(checkbox(BASE_LABEL)).toBeInTheDocument();
    expect(screen.queryByLabelText(INTERNAL_LABEL)).toBeNull();
  });

  it('passes the key to onKeyCreated and resets the form once the key was created', () => {
    const {onCreate, onKeyCreated} = renderForm();
    fireEvent.change(nameInput(), {target: {value: 'Test'}});
    fireEvent.click(checkbox(BASE_LABEL));
    fireEvent.change(screen.getByLabelText('Gültigkeit'), {target: {value: '3'}});
    submit();

    const onCreated = onCreate.mock.calls[0][1];
    let shown;
    act(() => {
      shown = onCreated('fbx_secret');
    });

    expect(shown).toBe(true);
    expect(onKeyCreated).toHaveBeenCalledWith('fbx_secret');
    expect(nameInput().value).toBe('');
    expect(checkbox(BASE_LABEL)).not.toBeChecked();
    expect((screen.getByLabelText('Gültigkeit') as HTMLSelectElement).value).toBe('12');
    expect(screen.queryByText('Bitte geben Sie einen Namen ein.')).toBeNull();
  });

  it('reports a key that could not be shown and keeps the form', () => {
    const {onCreate} = renderForm({onKeyCreated: () => false});
    fireEvent.change(nameInput(), {target: {value: 'Test'}});
    fireEvent.click(checkbox(BASE_LABEL));
    submit();

    let shown;
    act(() => {
      shown = onCreate.mock.calls[0][1]('fbx_secret');
    });

    expect(shown).toBe(false);
    expect(nameInput().value).toBe('Test');
  });

  it('asks to log in again when the server refuses the admin', () => {
    renderForm({createError: 'forbidden'});
    expect(screen.getByRole('alert')).toHaveTextContent('Bitte melden Sie sich erneut an.');
  });

  it('shows a create error and disables the form while creating', () => {
    renderForm({createError: 'failed', creating: true});
    expect(screen.getByRole('alert')).toHaveTextContent('Der API-Schlüssel konnte nicht erstellt werden.');
    expect(screen.getByRole('button', {name: /Schlüssel erstellen/})).toBeDisabled();
    expect(nameInput()).toBeDisabled();
  });

  describe('validate', () => {
    const t = (key: string) => key;

    it('rejects the internal scope without the base scope', () => {
      expect(validate({name: 'x', scopes: [INTERNAL], confirmPersonalData: true, expiresInMonths: '12'}, t).scopes)
        .toBe('apiAccess.create.requiresScope');
    });
  });

  describe('toPayload', () => {
    it('orders scopes like availableScopes and drops a stale confirmation', () => {
      expect(toPayload({name: ' x ', scopes: [INTERNAL, BASE], confirmPersonalData: true, expiresInMonths: '6'}, [BASE, INTERNAL]))
        .toEqual({name: 'x', scopes: [BASE, INTERNAL], expiresInMonths: 6, confirmPersonalData: true});
      expect(toPayload({name: 'x', scopes: [BASE], confirmPersonalData: true, expiresInMonths: '12'}, [BASE, INTERNAL]))
        .toEqual({name: 'x', scopes: [BASE], expiresInMonths: 12, confirmPersonalData: false});
    });
  });

  describe('toggleScope', () => {
    it('adds a scope once and removes dependants with their requirement', () => {
      expect(toggleScope([BASE], BASE, true)).toEqual([BASE]);
      expect(toggleScope([BASE], INTERNAL, true)).toEqual([BASE, INTERNAL]);
      expect(toggleScope([BASE, INTERNAL], BASE, false)).toEqual([]);
      expect(toggleScope([BASE, INTERNAL], INTERNAL, false)).toEqual([BASE]);
    });
  });
});
