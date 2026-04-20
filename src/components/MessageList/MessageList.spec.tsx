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

jest.mock('./MessageHeader', () => ({
  __esModule: true,
  default: ({ item, selected }: any) => (
    <div data-testid="message-header" data-selected={String(selected)}>
      {item.key}
    </div>
  ),
}));

jest.mock('./MessageContent', () => ({
  __esModule: true,
  default: ({ item }: any) => (
    <div data-testid="message-content">{item.key}</div>
  ),
}));

import MessageList from './MessageList';

const makeMessage = (key: string) => ({
  key,
  name: `Name ${key}`,
  message: `Message ${key}`,
});

const makeProps = (overrides: any = {}) => ({
  messages: { data: { array: [] }, selected: null },
  loadMessages: jest.fn(),
  selectMessage: jest.fn(),
  ...overrides,
});

describe('<MessageList>', () => {
  it('dispatches loadMessages on mount', () => {
    const loadMessages = jest.fn();
    render(wrap(<MessageList {...makeProps({ loadMessages })} />));
    expect(loadMessages).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when no messages', () => {
    const { container } = render(wrap(<MessageList {...makeProps()} />));
    expect(container.textContent).toContain('message.noMessages');
  });

  it('renders one MessageHeader per message', () => {
    const { getAllByTestId } = render(
      wrap(
        <MessageList
          {...makeProps({
            messages: {
              data: {
                array: [makeMessage('m1'), makeMessage('m2'), makeMessage('m3')],
              },
              selected: null,
            },
          })}
        />
      )
    );
    expect(getAllByTestId('message-header').length).toBe(3);
  });

  it('renders MessageContent only for the selected message', () => {
    const { getAllByTestId, getByTestId } = render(
      wrap(
        <MessageList
          {...makeProps({
            messages: {
              data: {
                array: [makeMessage('m1'), makeMessage('m2')],
              },
              selected: 'm2',
            },
          })}
        />
      )
    );
    expect(getAllByTestId('message-content').length).toBe(1);
    expect(getByTestId('message-content').textContent).toBe('m2');
  });

  it('dispatches selectMessage with key when clicked', () => {
    const selectMessage = jest.fn();
    const { getAllByTestId } = render(
      wrap(
        <MessageList
          {...makeProps({
            messages: {
              data: { array: [makeMessage('m1'), makeMessage('m2')] },
              selected: null,
            },
            selectMessage,
          })}
        />
      )
    );
    fireEvent.click(getAllByTestId('message-header')[1].parentElement!);
    expect(selectMessage).toHaveBeenCalledWith('m2');
  });

  it('dispatches selectMessage(null) when selected message is clicked again', () => {
    const selectMessage = jest.fn();
    const { getAllByTestId } = render(
      wrap(
        <MessageList
          {...makeProps({
            messages: {
              data: { array: [makeMessage('m1')] },
              selected: 'm1',
            },
            selectMessage,
          })}
        />
      )
    );
    fireEvent.click(getAllByTestId('message-header')[0].parentElement!);
    expect(selectMessage).toHaveBeenCalledWith(null);
  });
});
