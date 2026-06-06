import React from 'react';
import {renderWithTheme, fireEvent} from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}));

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({icon}: {icon: string}) {
    return <span data-testid="material-icon" data-icon={icon}/>;
  };
});

import Hints from './Hints';

const STORAGE_KEY = 'startPageHintsDismissed';

describe('components', () => {
  describe('StartPage', () => {
    describe('Hints', () => {
      beforeEach(() => {
        window.localStorage.clear();
      });

      it('renders the hint list for a regular user', () => {
        const {getByText} = renderWithTheme(<Hints/>);
        expect(getByText('hints.departureBeforeStart_text')).toBeTruthy();
        expect(getByText('hints.arrivalAfterLanding_text')).toBeTruthy();
      });

      it('shows the dismiss button for a regular user', () => {
        const {container} = renderWithTheme(<Hints/>);
        expect(container.querySelector('[data-icon="close"]')).toBeTruthy();
      });

      it('does not show the dismiss button for a guest', () => {
        const {container} = renderWithTheme(<Hints guest={true}/>);
        expect(container.querySelector('[data-icon="close"]')).toBeNull();
        expect(container.querySelector('ul')).toBeTruthy();
      });

      it('does not show the dismiss button for a kiosk', () => {
        const {container} = renderWithTheme(<Hints kiosk={true}/>);
        expect(container.querySelector('[data-icon="close"]')).toBeNull();
        expect(container.querySelector('ul')).toBeTruthy();
      });

      it('does not show the dismiss button when hintsDismissable is false', () => {
        const {container} = renderWithTheme(<Hints hintsDismissable={false}/>);
        expect(container.querySelector('[data-icon="close"]')).toBeNull();
        expect(container.querySelector('ul')).toBeTruthy();
      });

      it('hides the panel and persists the choice when dismissed', () => {
        const {container, getByText, queryByText, getByLabelText} = renderWithTheme(<Hints/>);
        fireEvent.click(getByLabelText('hints.dismiss'));
        expect(queryByText('hints.departureBeforeStart_text')).toBeNull();
        expect(getByText('hints.show')).toBeTruthy();
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true');
        expect(container.querySelector('[data-icon="help_outline"]')).toBeTruthy();
      });

      it('restores the persisted dismissed state on mount', () => {
        window.localStorage.setItem(STORAGE_KEY, 'true');
        const {getByText, queryByText} = renderWithTheme(<Hints/>);
        expect(queryByText('hints.departureBeforeStart_text')).toBeNull();
        expect(getByText('hints.show')).toBeTruthy();
      });

      it('brings the panel back and clears the flag when show is clicked', () => {
        window.localStorage.setItem(STORAGE_KEY, 'true');
        const {getByText} = renderWithTheme(<Hints/>);
        fireEvent.click(getByText('hints.show'));
        expect(getByText('hints.departureBeforeStart_text')).toBeTruthy();
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false');
      });

      it('ignores a persisted dismissed flag for guest sessions', () => {
        window.localStorage.setItem(STORAGE_KEY, 'true');
        const {getByText, container} = renderWithTheme(<Hints guest={true}/>);
        expect(getByText('hints.departureBeforeStart_text')).toBeTruthy();
        expect(container.querySelector('[data-icon="close"]')).toBeNull();
      });

      it('ignores a persisted dismissed flag when hintsDismissable is false', () => {
        window.localStorage.setItem(STORAGE_KEY, 'true');
        const {getByText, container} = renderWithTheme(<Hints hintsDismissable={false}/>);
        expect(getByText('hints.departureBeforeStart_text')).toBeTruthy();
        expect(container.querySelector('[data-icon="close"]')).toBeNull();
      });
    });
  });
});
