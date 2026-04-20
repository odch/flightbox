import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

const theme = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};
const wrap = (el: React.ReactElement) => (
  <ThemeProvider theme={theme}>{el}</ThemeProvider>
);

jest.mock('./StatusForm', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="status-form" data-disabled={String(props.disabled)} />
  ),
}));

jest.mock('./StatusList', () => ({
  __esModule: true,
  default: (props: any) => (
    <div data-testid="status-list" data-count={props.items.array.length} />
  ),
}));

import AerodromeStatusForm from './AerodromeStatusForm';

const makeProps = (overrides: any = {}) => ({
  data: { status: 'open', details: '' },
  disabled: false,
  dirty: false,
  latest: { array: [] },
  selected: null,
  loadAerodromeStatus: jest.fn(),
  updateAerodromeStatus: jest.fn(),
  saveAerodromeStatus: jest.fn(),
  selectAerodromeStatus: jest.fn(),
  ...overrides,
});

describe('<AerodromeStatusForm>', () => {
  it('dispatches loadAerodromeStatus on mount', () => {
    const loadAerodromeStatus = jest.fn();
    render(
      wrap(<AerodromeStatusForm {...makeProps({ loadAerodromeStatus })} />)
    );
    expect(loadAerodromeStatus).toHaveBeenCalledTimes(1);
  });

  it('renders the StatusForm', () => {
    const { getByTestId } = render(
      wrap(<AerodromeStatusForm {...makeProps()} />)
    );
    expect(getByTestId('status-form')).toBeTruthy();
  });

  it('does not render the StatusList when latest array is empty', () => {
    const { queryByTestId } = render(
      wrap(<AerodromeStatusForm {...makeProps()} />)
    );
    expect(queryByTestId('status-list')).toBeNull();
  });

  it('renders the StatusList when there are latest items', () => {
    const { getByTestId } = render(
      wrap(
        <AerodromeStatusForm
          {...makeProps({
            latest: { array: [{ key: 'a' }, { key: 'b' }] },
          })}
        />
      )
    );
    expect(getByTestId('status-list').getAttribute('data-count')).toBe('2');
  });

  it('passes disabled through to StatusForm', () => {
    const { getByTestId } = render(
      wrap(<AerodromeStatusForm {...makeProps({ disabled: true })} />)
    );
    expect(getByTestId('status-form').getAttribute('data-disabled')).toBe(
      'true'
    );
  });
});
