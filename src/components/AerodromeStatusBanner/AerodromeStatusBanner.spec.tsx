import React from 'react';
import {fireEvent} from '@testing-library/react';
import {renderWithTheme} from '../../../test/renderWithTheme';

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

const STORAGE_KEY = 'aerodromeStatusBannerExpanded';

describe('components', () => {
  describe('AerodromeStatusBanner', () => {
    beforeEach(() => {
      window.localStorage.clear();
    });

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

    it('is collapsed by default, showing the label but hiding the details', () => {
      const {getByText, queryByText} = renderWithTheme(
        <AerodromeStatusBanner
          enabled={true}
          status={{status: 'closed', details: 'Runway works', timestamp: 1717500000000}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      expect(getByText('label.closed')).toBeTruthy();
      expect(queryByText('Runway works')).toBeNull();
      expect(document.querySelector('[data-icon="expand_more"]')).toBeTruthy();
    });

    it('reveals the details and timestamp when the summary is clicked', () => {
      const {getByText, queryByText, getByRole} = renderWithTheme(
        <AerodromeStatusBanner
          enabled={true}
          status={{status: 'closed', details: 'Runway works', timestamp: 1717500000000}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      expect(queryByText('Runway works')).toBeNull();
      fireEvent.click(getByRole('button'));
      expect(getByText('Runway works')).toBeTruthy();
      expect(getByText('formatted:1717500000000')).toBeTruthy();
      expect(document.querySelector('[data-icon="expand_less"]')).toBeTruthy();
    });

    it('restores the persisted expanded state on mount', () => {
      window.localStorage.setItem(STORAGE_KEY, 'true');
      const {getByText} = renderWithTheme(
        <AerodromeStatusBanner
          enabled={true}
          status={{status: 'closed', details: 'Runway works', timestamp: 1717500000000}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      // Expanded without any interaction because the choice was remembered.
      expect(getByText('Runway works')).toBeTruthy();
    });

    it('persists the expand/collapse choice when toggled', () => {
      const {getByRole} = renderWithTheme(
        <AerodromeStatusBanner
          enabled={true}
          status={{status: 'closed', details: 'Runway works', timestamp: 1717500000000}}
          watchCurrentAerodromeStatus={jest.fn()}
        />
      );
      fireEvent.click(getByRole('button'));
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true');
      fireEvent.click(getByRole('button'));
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false');
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

    it('shows the open status with its icon', () => {
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
