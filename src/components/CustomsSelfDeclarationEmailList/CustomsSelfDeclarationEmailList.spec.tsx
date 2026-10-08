import React from 'react';
import '../../i18n';
import {renderWithTheme, screen, fireEvent, within} from '../../../test/renderWithTheme';
import CustomsSelfDeclarationEmailList from './CustomsSelfDeclarationEmailList';

jest.mock('scroll-into-view', () => jest.fn());

// The real aircraft dropdown (search and free entry), with fixed options
// instead of the ones loaded from the database.
jest.mock('../../containers/AircraftDropdownContainer', () => {
  const React = require('react');
  const AircraftDropdown = require('../AircraftDropdown').default;
  const aircrafts = {
    data: {
      array: [
        {key: 'HBKLA', type: 'C172'},
        {key: 'HBKLB', type: 'PA28'},
        {key: 'DEABC', type: 'DR40'},
      ],
    },
  };
  return {
    __esModule: true,
    default: (props: any) => React.createElement(AircraftDropdown, {...props, aircrafts}),
  };
});

const EMAIL_PLACEHOLDER = 'Berechtigtes Login (E-Mail)';
const NO_AIRCRAFT_HINT = /Noch kein Luftfahrzeug erfasst: Die Zollanmeldungen dieser Person werden nicht direkt übermittelt/;

const SELF_DECLARANTS = [
  {email: 'b@example.ch', registrations: []},
  {email: 'a@example.ch', registrations: ['HBKLB', 'HBKLA']},
];

const renderList = (props: any = {}) => {
  const addSelfDeclarant = jest.fn();
  const removeSelfDeclarant = jest.fn();
  const addAircraft = jest.fn();
  const removeAircraft = jest.fn();
  const result = renderWithTheme(
    <CustomsSelfDeclarationEmailList
      selfDeclarants={SELF_DECLARANTS}
      loaded={true}
      saveFailed={false}
      addSelfDeclarant={addSelfDeclarant}
      removeSelfDeclarant={removeSelfDeclarant}
      addAircraft={addAircraft}
      removeAircraft={removeAircraft}
      {...props}
    />
  );
  return {...result, addSelfDeclarant, removeSelfDeclarant, addAircraft, removeAircraft};
};

const typeAndSubmit = (value: string) => {
  const input = screen.getByPlaceholderText(EMAIL_PLACEHOLDER) as HTMLInputElement;
  fireEvent.change(input, {target: {value}});
  fireEvent.submit(input.closest('form') as HTMLFormElement);
  return input;
};

const cardOf = (email: string) =>
  screen.getAllByTestId('self-declarant').find(card => within(card).queryByText(email) !== null) as HTMLElement;

const aircraftInputOf = (card: HTMLElement) =>
  within(card).getByRole('textbox') as HTMLInputElement;

// Types into the aircraft dropdown and leaves the input, as clicking the add
// button does in a browser.
const typeAircraft = (card: HTMLElement, value: string) => {
  const input = aircraftInputOf(card);
  fireEvent.focus(input);
  fireEvent.change(input, {target: {value}});
  fireEvent.blur(input);
};

const clickAddAircraft = (card: HTMLElement) =>
  fireEvent.click(within(card).getByRole('button', {name: /Luftfahrzeug hinzufügen/}));

describe('components', () => {
  describe('CustomsSelfDeclarationEmailList', () => {
    it('shows a loading text and no input until the list is loaded', () => {
      renderList({loaded: false, selfDeclarants: []});

      expect(screen.getByText('Bitte warten ...')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(EMAIL_PLACEHOLDER)).toBeNull();
    });

    it('shows one card per person, sorted by e-mail', () => {
      renderList();

      const cards = screen.getAllByTestId('self-declarant');
      expect(cards).toHaveLength(2);
      expect(within(cards[0]).getByText('a@example.ch')).toBeInTheDocument();
      expect(within(cards[1]).getByText('b@example.ch')).toBeInTheDocument();
    });

    it('lists the aircraft of a person sorted', () => {
      renderList();

      const card = cardOf('a@example.ch');
      const a = within(card).getByText('HBKLA');
      const b = within(card).getByText('HBKLB');
      expect(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(within(cardOf('b@example.ch')).queryByText('HBKLA')).toBeNull();
    });

    it('tells that the declarations of a person without aircraft are not forwarded directly', () => {
      renderList();

      expect(within(cardOf('b@example.ch')).getByText(NO_AIRCRAFT_HINT)).toBeInTheDocument();
      expect(within(cardOf('a@example.ch')).queryByText(NO_AIRCRAFT_HINT)).toBeNull();
    });

    it('uses an e-mail input', () => {
      renderList();

      expect(screen.getByPlaceholderText(EMAIL_PLACEHOLDER)).toHaveAttribute('type', 'email');
    });

    it('shows a hint when the list is empty', () => {
      renderList({selfDeclarants: []});

      expect(screen.getByText('Es sind noch keine Personen erfasst.')).toBeInTheDocument();
      expect(screen.queryByTestId('self-declarant')).toBeNull();
    });

    it('adds the trimmed, lower-cased e-mail and clears the input', () => {
      const {addSelfDeclarant} = renderList();

      const input = typeAndSubmit('  Hans.Muster@Example.CH ');

      expect(addSelfDeclarant).toHaveBeenCalledWith('hans.muster@example.ch');
      expect(input.value).toBe('');
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('does not add an invalid e-mail and tells the user', () => {
      const {addSelfDeclarant} = renderList();

      const input = typeAndSubmit('hans@example');

      expect(addSelfDeclarant).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      expect(input.value).toBe('hans@example');
    });

    it('ignores an e-mail already in the list (case-insensitive) and tells the user', () => {
      const {addSelfDeclarant} = renderList();

      typeAndSubmit('A@Example.ch');

      expect(addSelfDeclarant).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('Diese E-Mail-Adresse ist bereits erfasst.');
    });

    it('hides the validation message when the input changes', () => {
      renderList();

      const input = typeAndSubmit('invalid');
      expect(screen.getByRole('alert')).toBeInTheDocument();

      fireEvent.change(input, {target: {value: 'invalid@'}});
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('removes a person after confirmation', () => {
      const {removeSelfDeclarant} = renderList();

      fireEvent.click(within(cardOf('b@example.ch')).getByRole('button', {name: 'Person entfernen'}));
      expect(removeSelfDeclarant).not.toHaveBeenCalled();
      expect(screen.getByText("Möchten Sie 'b@example.ch' mit allen erfassten Luftfahrzeugen wirklich löschen?")).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', {name: /Löschen/}));
      expect(removeSelfDeclarant).toHaveBeenCalledWith('b@example.ch');
    });

    it('keeps a person when the removal is cancelled', () => {
      const {removeSelfDeclarant} = renderList();

      fireEvent.click(within(cardOf('b@example.ch')).getByRole('button', {name: 'Person entfernen'}));
      fireEvent.click(screen.getByRole('button', {name: /Abbrechen/}));

      expect(removeSelfDeclarant).not.toHaveBeenCalled();
    });

    it('adds an aircraft selected in the dropdown and clears the dropdown', () => {
      const {addAircraft} = renderList();
      const card = cardOf('b@example.ch');

      const input = aircraftInputOf(card);
      fireEvent.focus(input);
      fireEvent.change(input, {target: {value: 'hb-klb'}});
      fireEvent.keyDown(input, {key: 'Enter', keyCode: 13, which: 13});
      clickAddAircraft(card);

      expect(addAircraft).toHaveBeenCalledWith('b@example.ch', 'HBKLB');
      expect(aircraftInputOf(card).placeholder).toBe('');
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('adds a typed aircraft that is not in the dropdown (free entry), normalised', () => {
      const {addAircraft} = renderList();
      const card = cardOf('b@example.ch');

      typeAircraft(card, 'oe-k xy');
      clickAddAircraft(card);

      expect(addAircraft).toHaveBeenCalledWith('b@example.ch', 'OEKXY');
      expect(aircraftInputOf(card).placeholder).toBe('');
    });

    it('adds the aircraft to the person of the card', () => {
      const {addAircraft} = renderList();
      const card = cardOf('a@example.ch');

      typeAircraft(card, 'DEABC');
      clickAddAircraft(card);

      expect(addAircraft).toHaveBeenCalledWith('a@example.ch', 'DEABC');
    });

    it('does not add an aircraft the person already has and tells the user', () => {
      const {addAircraft} = renderList();
      const card = cardOf('a@example.ch');

      typeAircraft(card, 'hb-kla');
      clickAddAircraft(card);

      expect(addAircraft).not.toHaveBeenCalled();
      expect(within(card).getByRole('alert')).toHaveTextContent('Dieses Luftfahrzeug ist bei dieser Person bereits erfasst.');
    });

    it('asks for a registration when none was entered', () => {
      const {addAircraft} = renderList();
      const card = cardOf('b@example.ch');

      clickAddAircraft(card);

      expect(addAircraft).not.toHaveBeenCalled();
      expect(within(card).getByRole('alert')).toHaveTextContent('Bitte geben Sie eine gültige Immatrikulation ein (1 bis 10 Buchstaben oder Ziffern).');
    });

    it('does not add a registration longer than 10 characters', () => {
      const {addAircraft} = renderList();
      const card = cardOf('b@example.ch');

      typeAircraft(card, 'ABCDEFGHIJK');
      clickAddAircraft(card);

      expect(addAircraft).not.toHaveBeenCalled();
      expect(within(card).getByRole('alert')).toHaveTextContent('Bitte geben Sie eine gültige Immatrikulation ein');
    });

    it('hides the aircraft validation message when the aircraft changes', () => {
      renderList();
      const card = cardOf('b@example.ch');

      clickAddAircraft(card);
      expect(within(card).getByRole('alert')).toBeInTheDocument();

      typeAircraft(card, 'HBKLA');
      expect(within(card).queryByRole('alert')).toBeNull();
    });

    it('removes an aircraft after confirmation', () => {
      const {removeAircraft} = renderList();
      const card = cardOf('a@example.ch');

      const row = within(card).getByText('HBKLB').parentElement as HTMLElement;
      fireEvent.click(within(row).getByRole('button'));
      expect(removeAircraft).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', {name: /Löschen/}));
      expect(removeAircraft).toHaveBeenCalledWith('a@example.ch', 'HBKLB');
    });

    it('shows a generic message when saving failed', () => {
      renderList({saveFailed: true});

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Die Änderung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.'
      );
    });
  });
});
