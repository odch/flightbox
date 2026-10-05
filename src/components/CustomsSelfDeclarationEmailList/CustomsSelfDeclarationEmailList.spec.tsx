import React from 'react';
import '../../i18n';
import {renderWithTheme, screen, fireEvent} from '../../../test/renderWithTheme';
import CustomsSelfDeclarationEmailList from './CustomsSelfDeclarationEmailList';

const PLACEHOLDER = 'Login der Zollanmeldungs-App (E-Mail)';

const renderList = (props: any = {}) => {
  const addEmail = jest.fn();
  const removeEmail = jest.fn();
  const result = renderWithTheme(
    <CustomsSelfDeclarationEmailList
      emails={['b@example.ch', 'a@example.ch']}
      loaded={true}
      saveFailed={false}
      addEmail={addEmail}
      removeEmail={removeEmail}
      {...props}
    />
  );
  return {...result, addEmail, removeEmail};
};

const typeAndSubmit = (value: string) => {
  const input = screen.getByPlaceholderText(PLACEHOLDER) as HTMLInputElement;
  fireEvent.change(input, {target: {value}});
  fireEvent.submit(input.closest('form') as HTMLFormElement);
  return input;
};

describe('components', () => {
  describe('CustomsSelfDeclarationEmailList', () => {
    it('shows a loading text and no input until the list is loaded', () => {
      renderList({loaded: false, emails: []});

      expect(screen.getByText('Bitte warten ...')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(PLACEHOLDER)).toBeNull();
    });

    it('lists the e-mails sorted', () => {
      renderList();

      const a = screen.getByText('a@example.ch');
      const b = screen.getByText('b@example.ch');
      expect(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('uses an e-mail input', () => {
      renderList();

      expect(screen.getByPlaceholderText(PLACEHOLDER)).toHaveAttribute('type', 'email');
    });

    it('shows a hint when the list is empty', () => {
      renderList({emails: []});

      expect(screen.getByText('Es sind noch keine Personen erfasst.')).toBeInTheDocument();
    });

    it('adds the trimmed, lower-cased e-mail and clears the input', () => {
      const {addEmail} = renderList();

      const input = typeAndSubmit('  Hans.Muster@Example.CH ');

      expect(addEmail).toHaveBeenCalledWith('hans.muster@example.ch');
      expect(input.value).toBe('');
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('does not add an invalid e-mail and tells the user', () => {
      const {addEmail} = renderList();

      const input = typeAndSubmit('hans@example');

      expect(addEmail).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      expect(input.value).toBe('hans@example');
    });

    it('ignores an e-mail already in the list (case-insensitive) and tells the user', () => {
      const {addEmail} = renderList();

      typeAndSubmit('A@Example.ch');

      expect(addEmail).not.toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('Diese E-Mail-Adresse ist bereits erfasst.');
    });

    it('hides the validation message when the input changes', () => {
      renderList();

      const input = typeAndSubmit('invalid');
      expect(screen.getByRole('alert')).toBeInTheDocument();

      fireEvent.change(input, {target: {value: 'invalid@'}});
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('removes an e-mail after confirmation', () => {
      const {removeEmail} = renderList();

      const row = screen.getByText('b@example.ch').parentElement as HTMLElement;
      fireEvent.click(row.querySelector('button') as HTMLButtonElement);
      expect(removeEmail).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', {name: /Löschen/}));
      expect(removeEmail).toHaveBeenCalledWith('b@example.ch');
    });

    it('shows a generic message when saving failed', () => {
      renderList({saveFailed: true});

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Die Änderung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.'
      );
    });
  });
});
