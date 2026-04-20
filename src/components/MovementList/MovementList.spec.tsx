import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

const theme = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};
const wrap = (el: React.ReactElement) => (
  <ThemeProvider theme={theme}>{el}</ThemeProvider>
);

jest.mock('react-i18next', () => ({
  withTranslation: () => (Component: any) => {
    const Wrapped = (props: any) => (
      <Component {...props} t={(key: string) => key} />
    );
    Wrapped.displayName = `withTranslation(${
      Component.displayName || Component.name
    })`;
    return Wrapped;
  },
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
  useTranslation: () => ({ t: (key: string) => key }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

jest.mock('../../util/AutoLoad', () => ({
  AutoLoad: (List: any) => (props: any) => <List {...props} />,
}));

jest.mock('./LoadingInfo', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-info" />,
}));

jest.mock('./LoadingFailureInfo', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-failure-info" />,
}));

jest.mock('./NoMovmementsInfo', () => ({
  __esModule: true,
  default: () => <div data-testid="no-movements-info" />,
}));

jest.mock('./MovementGroup', () => ({
  __esModule: true,
  default: ({ label }: any) => (
    <div data-testid="movement-group">{label}</div>
  ),
}));

jest.mock('../MovementDeleteConfirmationDialog', () => ({
  __esModule: true,
  default: ({ item }: any) => (
    <div data-testid="delete-confirmation">{item.key}</div>
  ),
}));

jest.mock('../../containers/MovementFilterContainer', () => ({
  __esModule: true,
  default: () => <div data-testid="movement-filter" />,
}));

import MovementList from './MovementList';

const makeProps = (overrides: any = {}) => ({
  loadItems: jest.fn(),
  loadAircraftSettings: jest.fn(),
  checkCustomsAvailability: jest.fn(),
  loadAerodromes: jest.fn(),
  items: { array: [], length: 0 },
  selected: null,
  onSelect: jest.fn(),
  loading: false,
  loadingFailed: false,
  deleteConfirmation: null,
  deleteItem: jest.fn(),
  hideDeleteConfirmationDialog: jest.fn(),
  showDeleteConfirmationDialog: jest.fn(),
  onEdit: jest.fn(),
  createMovementFromMovement: jest.fn(),
  lockDate: { loading: false, date: null },
  aircraftSettings: { club: {}, homeBase: {} },
  isAdmin: false,
  ...overrides,
});

describe('<MovementList>', () => {
  describe('mount dispatches', () => {
    it('dispatches loadAircraftSettings on mount', () => {
      const loadAircraftSettings = jest.fn();
      render(
        wrap(<MovementList {...makeProps({ loadAircraftSettings })} />)
      );
      expect(loadAircraftSettings).toHaveBeenCalledTimes(1);
    });

    it('dispatches loadAerodromes on mount', () => {
      const loadAerodromes = jest.fn();
      render(wrap(<MovementList {...makeProps({ loadAerodromes })} />));
      expect(loadAerodromes).toHaveBeenCalledTimes(1);
    });

    it('dispatches checkCustomsAvailability on mount', () => {
      const checkCustomsAvailability = jest.fn();
      render(
        wrap(<MovementList {...makeProps({ checkCustomsAvailability })} />)
      );
      expect(checkCustomsAvailability).toHaveBeenCalledTimes(1);
    });

    it('dispatches onSelect(null) on mount', () => {
      const onSelect = jest.fn();
      render(wrap(<MovementList {...makeProps({ onSelect })} />));
      expect(onSelect).toHaveBeenCalledWith(null);
    });

    it('dispatches loadItems(true) on mount', () => {
      const loadItems = jest.fn();
      render(wrap(<MovementList {...makeProps({ loadItems })} />));
      expect(loadItems).toHaveBeenCalledWith(true);
    });
  });

  describe('loading gate', () => {
    it('renders loading info when lockDate is loading', () => {
      const { getAllByTestId, queryByTestId } = render(
        wrap(
          <MovementList
            {...makeProps({ lockDate: { loading: true, date: null } })}
          />
        )
      );
      expect(getAllByTestId('loading-info').length).toBe(1);
      expect(queryByTestId('movement-group')).toBeNull();
    });

    it('renders loading info when aircraftSettings.club is absent', () => {
      const { getAllByTestId, queryByTestId } = render(
        wrap(
          <MovementList
            {...makeProps({ aircraftSettings: { homeBase: {} } })}
          />
        )
      );
      expect(getAllByTestId('loading-info').length).toBe(1);
      expect(queryByTestId('movement-group')).toBeNull();
    });

    it('renders loading info when aircraftSettings.homeBase is absent', () => {
      const { getAllByTestId, queryByTestId } = render(
        wrap(
          <MovementList {...makeProps({ aircraftSettings: { club: {} } })} />
        )
      );
      expect(getAllByTestId('loading-info').length).toBe(1);
      expect(queryByTestId('movement-group')).toBeNull();
    });

    it('renders movement groups when data is ready', () => {
      const { getAllByTestId } = render(
        wrap(<MovementList {...makeProps()} />)
      );
      expect(getAllByTestId('movement-group').length).toBe(5);
    });
  });

  describe('conditional children', () => {
    it('renders MovementFilter only when isAdmin is true', () => {
      const { queryByTestId, rerender } = render(
        wrap(<MovementList {...makeProps({ isAdmin: false })} />)
      );
      expect(queryByTestId('movement-filter')).toBeNull();
      rerender(wrap(<MovementList {...makeProps({ isAdmin: true })} />));
      expect(queryByTestId('movement-filter')).toBeTruthy();
    });

    it('renders LoadingInfo when loading is true (below groups)', () => {
      const { getAllByTestId } = render(
        wrap(<MovementList {...makeProps({ loading: true })} />)
      );
      expect(getAllByTestId('loading-info').length).toBe(1);
    });

    it('renders LoadingFailureInfo when loadingFailed is true', () => {
      const { getByTestId } = render(
        wrap(<MovementList {...makeProps({ loadingFailed: true })} />)
      );
      expect(getByTestId('loading-failure-info')).toBeTruthy();
    });

    it('renders NoMovementsInfo when not loading and no items', () => {
      const { getByTestId } = render(
        wrap(<MovementList {...makeProps()} />)
      );
      expect(getByTestId('no-movements-info')).toBeTruthy();
    });

    it('does not render NoMovementsInfo while loading', () => {
      const { queryByTestId } = render(
        wrap(<MovementList {...makeProps({ loading: true })} />)
      );
      expect(queryByTestId('no-movements-info')).toBeNull();
    });

    it('renders delete confirmation dialog when deleteConfirmation is set', () => {
      const { getByTestId } = render(
        wrap(
          <MovementList
            {...makeProps({ deleteConfirmation: { key: 'mov-to-delete' } })}
          />
        )
      );
      expect(getByTestId('delete-confirmation').textContent).toBe(
        'mov-to-delete'
      );
    });
  });
});
