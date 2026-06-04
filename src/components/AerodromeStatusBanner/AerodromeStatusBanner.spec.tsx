import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {renderWithTheme} from '../../../test/renderWithTheme';
import {ThemeProvider} from 'styled-components';
import {BrowserRouter} from 'react-router-dom';

const theme: any = {colors: {main: '#003863', background: '#fafafa', danger: '#e00f00'}};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({t: (key: string) => key}),
}));

jest.mock('../AerodromeStatusForm/StatusOptions', () => ({
  getLabel: (key: string) => `label.${key}`,
}));

jest.mock('../../util/dates', () => ({
  formatDateTime: (ts: number) => `formatted:${ts}`,
}));

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({icon}: {icon: string}) {
    return <span data-testid="material-icon" data-icon={icon}/>;
  };
});

import AerodromeStatusBanner from './AerodromeStatusBanner';

describe('components', () => {
  describe('AerodromeStatusBanner', () => {
    it('dispatches watchCurrentAerodromeStatus on mount', () => {
      const watch = jest.fn();
      renderWithTheme(
        <AerodromeStatusBanner enabled={true} status={null} watchCurrentAerodromeStatus={watch}/>
      );
      expect(watch).toHaveBeenCalledTimes(1);
    });

    it('renders nothing when disabled, even with a status', () => {
      const {container} = renderWithTheme(
        <AerodromeStatusBanner
          enabled={false}
          status={{status: 'closed', details: 'Runway works', timestamp: 1717500000000}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing while status is loading (undefined)', () => {
      const {container} = renderWithTheme(
        <AerodromeStatusBanner enabled={true} status={undefined} watchCurrentAerodromeStatus={jest.fn()}/>
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when no status has been set (null)', () => {
      const {container} = renderWithTheme(
        <AerodromeStatusBanner enabled={true} status={null} watchCurrentAerodromeStatus={jest.fn()}/>
      );
      expect(container.firstChild).toBeNull();
    });

    it('auto-expands a non-open status that loads asynchronously after mount', () => {
      const wrap = (status: any) => (
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <AerodromeStatusBanner enabled={true} status={status} watchCurrentAerodromeStatus={jest.fn()}/>
          </ThemeProvider>
        </BrowserRouter>
      );
      // Mounts before the live status arrives (current === undefined).
      const {rerender, queryByText, getByText} = render(wrap(undefined));
      expect(queryByText('Runway works')).toBeNull();

      // Status arrives via the real-time listener -> should be expanded by default.
      rerender(wrap({status: 'closed', details: 'Runway works', timestamp: 1717500000000}));
      expect(getByText('Runway works')).toBeTruthy();
    });

    it('expands a non-open status by default, showing details and timestamp', () => {
      const {getByText} = renderWithTheme(
        <AerodromeStatusBanner
          enabled={true}
          status={{status: 'closed', details: 'Runway works', timestamp: 1717500000000}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      expect(getByText('label.closed')).toBeTruthy();
      expect(getByText('Runway works')).toBeTruthy();
      expect(getByText('formatted:1717500000000')).toBeTruthy();
      expect(document.querySelector('[data-icon="block"]')).toBeTruthy();
    });

    it('collapses the open status by default, hiding the details', () => {
      const {getByText, queryByText} = renderWithTheme(
        <AerodromeStatusBanner
          enabled={true}
          status={{status: 'open', details: 'All good', timestamp: 1717500000000}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      expect(getByText('label.open')).toBeTruthy();
      expect(queryByText('All good')).toBeNull();
      expect(document.querySelector('[data-icon="expand_more"]')).toBeTruthy();
    });

    it('toggles the details when the summary is clicked', () => {
      const {getByText, queryByText, getByRole} = renderWithTheme(
        <AerodromeStatusBanner
          enabled={true}
          status={{status: 'open', details: 'All good', timestamp: 1717500000000}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      expect(queryByText('All good')).toBeNull();
      fireEvent.click(getByRole('button'));
      expect(getByText('All good')).toBeTruthy();
      expect(document.querySelector('[data-icon="expand_less"]')).toBeTruthy();
    });

    it('does not link out to a separate status page', () => {
      const {container} = renderWithTheme(
        <AerodromeStatusBanner
          enabled={true}
          status={{status: 'closed', details: 'Runway works', timestamp: 1717500000000}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      expect(container.querySelector('a')).toBeNull();
    });

    it('uses the warning icon for the restricted status', () => {
      renderWithTheme(
        <AerodromeStatusBanner
          enabled={true}
          status={{status: 'restricted', details: ''}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      expect(document.querySelector('[data-icon="warning"]')).toBeTruthy();
    });

    it('falls back to the info icon for an unknown status', () => {
      renderWithTheme(
        <AerodromeStatusBanner
          enabled={true}
          status={{status: 'maintenance', details: ''}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      expect(document.querySelector('[data-icon="info"]')).toBeTruthy();
    });

    it('omits the details element when details is empty', () => {
      const {getByText} = renderWithTheme(
        <AerodromeStatusBanner
          enabled={true}
          status={{status: 'open', details: ''}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      expect(getByText('label.open')).toBeTruthy();
      expect(document.querySelector('[data-icon="check_circle"]')).toBeTruthy();
    });
  });
});
