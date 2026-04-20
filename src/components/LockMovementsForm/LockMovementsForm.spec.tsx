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

jest.mock('../DatePicker', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <input
      data-testid="date-picker"
      defaultValue={value || ''}
      onChange={e => onChange({ value: e.target.value })}
    />
  ),
}));

import LockMovementsForm from './LockMovementsForm';

const makeProps = (overrides: any = {}) => ({
  lockDate: { date: null, loading: false },
  loadLockDate: jest.fn(),
  setLockDate: jest.fn(),
  ...overrides,
});

describe('<LockMovementsForm>', () => {
  it('dispatches loadLockDate on mount', () => {
    const loadLockDate = jest.fn();
    render(wrap(<LockMovementsForm {...makeProps({ loadLockDate })} />));
    expect(loadLockDate).toHaveBeenCalledTimes(1);
  });

  it('renders DatePicker with null value when no lockDate', () => {
    const { getByTestId } = render(
      wrap(<LockMovementsForm {...makeProps()} />)
    );
    expect((getByTestId('date-picker') as HTMLInputElement).value).toBe('');
  });

  it('renders DatePicker with formatted lockDate', () => {
    const date = new Date(2026, 3, 15).getTime();
    const { getByTestId } = render(
      wrap(
        <LockMovementsForm
          {...makeProps({ lockDate: { date, loading: false } })}
        />
      )
    );
    expect((getByTestId('date-picker') as HTMLInputElement).value).toBe(
      '2026-04-15'
    );
  });

  it('dispatches setLockDate with epoch ms on date change', () => {
    const setLockDate = jest.fn();
    const { getByTestId } = render(
      wrap(<LockMovementsForm {...makeProps({ setLockDate })} />)
    );
    fireEvent.change(getByTestId('date-picker'), {
      target: { value: '2026-05-01' },
    });
    const expectedMs = new Date('2026-05-01').getTime();
    expect(setLockDate).toHaveBeenCalledWith(expectedMs);
  });

  it('dispatches setLockDate with null when cleared', () => {
    const setLockDate = jest.fn();
    const date = new Date(2026, 3, 15).getTime();
    const { getByTestId } = render(
      wrap(
        <LockMovementsForm
          {...makeProps({ setLockDate, lockDate: { date, loading: false } })}
        />
      )
    );
    fireEvent.change(getByTestId('date-picker'), { target: { value: '' } });
    expect(setLockDate).toHaveBeenCalledWith(null);
  });
});
