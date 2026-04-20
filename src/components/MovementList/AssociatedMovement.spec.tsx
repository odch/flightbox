import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

const theme: any = {
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

jest.mock('../MaterialIcon', () => ({
  __esModule: true,
  default: ({ icon }: any) => <span data-testid="material-icon" data-icon={icon} />,
}));

jest.mock('./MovementDetails', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="movement-details">{JSON.stringify(props.data)}</div>
  ),
}));

jest.mock('./Action', () => ({
  __esModule: true,
  default: ({ label, onClick }: any) => (
    <button onClick={onClick} data-testid="action">
      {label}
    </button>
  ),
}));

import AssociatedMovement from './AssociatedMovement';

const makeProps = (overrides: any = {}) => ({
  movementType: 'departure',
  movementKey: 'mov-key-1',
  isHomeBase: false,
  isAdmin: false,
  loading: false,
  associatedMovement: { key: 'assoc-key-1', type: 'arrival' },
  associatedMovementData: undefined,
  loadMovement: jest.fn(),
  createMovementFromMovement: jest.fn(),
  ...overrides,
});

describe('<AssociatedMovement>', () => {
  describe('mount dispatch', () => {
    it('dispatches loadMovement when data is undefined', () => {
      const loadMovement = jest.fn();
      render(
        wrap(
          <AssociatedMovement
            {...makeProps({
              loadMovement,
              associatedMovement: { key: 'k1', type: 'arrival' },
              associatedMovementData: undefined,
            })}
          />
        )
      );
      expect(loadMovement).toHaveBeenCalledWith('k1', 'arrival');
    });

    it('does NOT dispatch loadMovement when data is already loaded', () => {
      const loadMovement = jest.fn();
      render(
        wrap(
          <AssociatedMovement
            {...makeProps({
              loadMovement,
              associatedMovementData: { key: 'k1', immatriculation: 'HB-XXX' },
            })}
          />
        )
      );
      expect(loadMovement).not.toHaveBeenCalled();
    });

    it('does NOT dispatch loadMovement when data is null (none found)', () => {
      const loadMovement = jest.fn();
      render(
        wrap(
          <AssociatedMovement
            {...makeProps({
              loadMovement,
              associatedMovementData: null,
            })}
          />
        )
      );
      expect(loadMovement).not.toHaveBeenCalled();
    });

    it('does NOT dispatch loadMovement when associatedMovement.type is "none"', () => {
      const loadMovement = jest.fn();
      render(
        wrap(
          <AssociatedMovement
            {...makeProps({
              loadMovement,
              associatedMovement: { key: 'k1', type: 'none' },
            })}
          />
        )
      );
      expect(loadMovement).not.toHaveBeenCalled();
    });
  });

  describe('update dispatch', () => {
    it('re-dispatches loadMovement when data becomes undefined again', () => {
      const loadMovement = jest.fn();
      const { rerender } = render(
        wrap(
          <AssociatedMovement
            {...makeProps({
              loadMovement,
              associatedMovementData: { key: 'k1' },
            })}
          />
        )
      );
      expect(loadMovement).not.toHaveBeenCalled();
      rerender(
        wrap(
          <AssociatedMovement
            {...makeProps({
              loadMovement,
              associatedMovementData: undefined,
            })}
          />
        )
      );
      expect(loadMovement).toHaveBeenCalledWith('assoc-key-1', 'arrival');
    });

    it('does not re-dispatch once data is loaded', () => {
      const loadMovement = jest.fn();
      const { rerender } = render(
        wrap(
          <AssociatedMovement
            {...makeProps({
              loadMovement,
              associatedMovementData: undefined,
            })}
          />
        )
      );
      rerender(
        wrap(
          <AssociatedMovement
            {...makeProps({
              loadMovement,
              associatedMovementData: { key: 'k1' },
            })}
          />
        )
      );
      expect(loadMovement).toHaveBeenCalledTimes(1);
    });
  });

  describe('render', () => {
    it('shows loading icon when data undefined', () => {
      const { getByTestId } = render(
        wrap(<AssociatedMovement {...makeProps()} />)
      );
      expect(getByTestId('material-icon').getAttribute('data-icon')).toBe('sync');
    });

    it('shows details when data present', () => {
      const { getByTestId } = render(
        wrap(
          <AssociatedMovement
            {...makeProps({
              associatedMovementData: { key: 'k1', immatriculation: 'HB-XYZ' },
            })}
          />
        )
      );
      expect(getByTestId('movement-details')).toBeTruthy();
    });

    it('shows create action when data is null', () => {
      const { getByTestId } = render(
        wrap(
          <AssociatedMovement
            {...makeProps({
              associatedMovementData: null,
            })}
          />
        )
      );
      expect(getByTestId('action')).toBeTruthy();
    });

    it('triggers createMovementFromMovement when action is clicked', () => {
      const createMovementFromMovement = jest.fn();
      const { getByTestId } = render(
        wrap(
          <AssociatedMovement
            {...makeProps({
              associatedMovementData: null,
              createMovementFromMovement,
              movementType: 'arrival',
              movementKey: 'mov-2',
            })}
          />
        )
      );
      fireEvent.click(getByTestId('action'));
      expect(createMovementFromMovement).toHaveBeenCalledWith('arrival', 'mov-2');
    });
  });
});
