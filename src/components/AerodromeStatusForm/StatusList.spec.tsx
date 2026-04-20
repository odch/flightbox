import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';

const theme: any = {
  colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
};
const wrap = (el: React.ReactElement) => (
  <ThemeProvider theme={theme}>{el}</ThemeProvider>
);

jest.mock('./StatusHeader', () => ({
  __esModule: true,
  default: ({ item, selected, active, onClick }: any) => (
    <div
      data-testid="status-header"
      data-key={item.key}
      data-selected={String(selected)}
      data-active={String(active)}
      onClick={onClick}
    >
      {item.status}
    </div>
  ),
}));

jest.mock('./StatusContent', () => ({
  __esModule: true,
  default: ({ item }: any) => (
    <div data-testid="status-content">{item.key}</div>
  ),
}));

import StatusList from './StatusList';

const makeStatus = (key: string, status = 'open') => ({
  key,
  status,
  details: '',
  by: 'admin',
  timestamp: 0,
});

const makeProps = (overrides: any = {}) => ({
  items: { array: [] },
  selected: null,
  selectStatus: jest.fn(),
  ...overrides,
});

describe('<StatusList>', () => {
  it('renders one StatusHeader per item', () => {
    const { getAllByTestId } = render(
      wrap(
        <StatusList
          {...makeProps({
            items: {
              array: [makeStatus('s1'), makeStatus('s2'), makeStatus('s3')],
            },
          })}
        />
      )
    );
    expect(getAllByTestId('status-header').length).toBe(3);
  });

  it('marks the first item as active', () => {
    const { getAllByTestId } = render(
      wrap(
        <StatusList
          {...makeProps({
            items: { array: [makeStatus('s1'), makeStatus('s2')] },
          })}
        />
      )
    );
    const headers = getAllByTestId('status-header');
    expect(headers[0].getAttribute('data-active')).toBe('true');
    expect(headers[1].getAttribute('data-active')).toBe('false');
  });

  it('renders StatusContent for the active (first) item', () => {
    const { getAllByTestId } = render(
      wrap(
        <StatusList
          {...makeProps({
            items: { array: [makeStatus('s1'), makeStatus('s2')] },
          })}
        />
      )
    );
    const contents = getAllByTestId('status-content');
    expect(contents.length).toBe(1);
    expect(contents[0].textContent).toBe('s1');
  });

  it('renders StatusContent for the selected non-active item too', () => {
    const { getAllByTestId } = render(
      wrap(
        <StatusList
          {...makeProps({
            items: { array: [makeStatus('s1'), makeStatus('s2'), makeStatus('s3')] },
            selected: 's3',
          })}
        />
      )
    );
    const contents = getAllByTestId('status-content');
    const keys = contents.map(n => n.textContent);
    expect(keys).toEqual(expect.arrayContaining(['s1', 's3']));
    expect(contents.length).toBe(2);
  });

  it('dispatches selectStatus with key on non-active header click', () => {
    const selectStatus = jest.fn();
    const { getAllByTestId } = render(
      wrap(
        <StatusList
          {...makeProps({
            items: { array: [makeStatus('s1'), makeStatus('s2')] },
            selectStatus,
          })}
        />
      )
    );
    fireEvent.click(getAllByTestId('status-header')[1]);
    expect(selectStatus).toHaveBeenCalledWith('s2');
  });

  it('dispatches selectStatus(null) when clicking currently selected item', () => {
    const selectStatus = jest.fn();
    const { getAllByTestId } = render(
      wrap(
        <StatusList
          {...makeProps({
            items: { array: [makeStatus('s1'), makeStatus('s2')] },
            selected: 's2',
            selectStatus,
          })}
        />
      )
    );
    fireEvent.click(getAllByTestId('status-header')[1]);
    expect(selectStatus).toHaveBeenCalledWith(null);
  });
});
