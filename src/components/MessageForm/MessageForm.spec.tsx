import React from 'react';
import { render, fireEvent } from '@testing-library/react';
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

jest.mock('./Dialog', () => ({
  __esModule: true,
  default: ({ heading, onClose }: any) => (
    <div data-testid="dialog" onClick={onClose}>
      {heading}
    </div>
  ),
}));

jest.mock('./renderField', () => ({
  renderInputField: ({ input, label }: any) => (
    <label>
      {label}
      <input data-testid={`input-${input.name}`} {...input} />
    </label>
  ),
  renderPhoneField: ({ input, label }: any) => (
    <label>
      {label}
      <input data-testid={`input-${input.name}`} {...input} />
    </label>
  ),
  renderTextArea: ({ input, label }: any) => (
    <label>
      {label}
      <textarea data-testid={`input-${input.name}`} {...input} />
    </label>
  ),
}));

import MessageForm from './MessageForm';

const makeProps = (overrides: any = {}) => ({
  sent: false,
  commitFailed: false,
  onSubmit: jest.fn(),
  resetMessageForm: jest.fn(),
  confirmSaveMessageSuccess: jest.fn(),
  initialValues: {},
  ...overrides,
});

describe('<MessageForm>', () => {
  it('dispatches resetMessageForm on unmount', () => {
    const resetMessageForm = jest.fn();
    const { unmount } = render(
      wrap(<MessageForm {...makeProps({ resetMessageForm })} />)
    );
    expect(resetMessageForm).not.toHaveBeenCalled();
    unmount();
    expect(resetMessageForm).toHaveBeenCalledTimes(1);
  });

  it('prefills fields from initialValues', () => {
    const { getByTestId } = render(
      wrap(
        <MessageForm
          {...makeProps({
            initialValues: {
              name: 'Roland',
              email: 'r@example.ch',
              phone: '+41791234567',
            },
          })}
        />
      )
    );
    expect((getByTestId('input-name') as HTMLInputElement).value).toBe('Roland');
    expect((getByTestId('input-email') as HTMLInputElement).value).toBe(
      'r@example.ch'
    );
    expect((getByTestId('input-phone') as HTMLInputElement).value).toBe(
      '+41791234567'
    );
  });

  it('renders success dialog when sent is true', () => {
    const { getByTestId } = render(
      wrap(<MessageForm {...makeProps({ sent: true })} />)
    );
    expect(getByTestId('dialog').textContent).toBe('message.successHeading');
  });

  it('renders error dialog when commitFailed is true', () => {
    const { getByTestId } = render(
      wrap(<MessageForm {...makeProps({ commitFailed: true })} />)
    );
    expect(getByTestId('dialog').textContent).toBe('message.errorHeading');
  });

  it('calls onSubmit when form is submitted', () => {
    const onSubmit = jest.fn();
    const { container } = render(
      wrap(
        <MessageForm
          {...makeProps({
            onSubmit,
            initialValues: {
              name: 'R',
              email: 'a@b.ch',
              phone: '+41791234567',
              message: 'hi',
            },
          })}
        />
      )
    );
    fireEvent.submit(container.querySelector('form')!);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('closes success dialog by dispatching confirmSaveMessageSuccess', () => {
    const confirmSaveMessageSuccess = jest.fn();
    const { getByTestId } = render(
      wrap(
        <MessageForm
          {...makeProps({ sent: true, confirmSaveMessageSuccess })}
        />
      )
    );
    fireEvent.click(getByTestId('dialog'));
    expect(confirmSaveMessageSuccess).toHaveBeenCalled();
  });
});
