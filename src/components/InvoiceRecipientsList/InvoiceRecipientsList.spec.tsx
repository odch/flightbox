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

jest.mock('../MaterialIcon', () => ({
  __esModule: true,
  default: ({ icon }: any) => <span data-icon={icon} />,
}));

jest.mock('./InvoiceRecipient', () => ({
  __esModule: true,
  default: ({ recipient }: any) => (
    <div data-testid="recipient">{recipient.name}</div>
  ),
}));

import InvoiceRecipientsList from './InvoiceRecipientsList';

const makeProps = (overrides: any = {}) => ({
  invoiceRecipients: [],
  addInvoiceRecipient: jest.fn(),
  addInvoiceRecipientEmail: jest.fn(),
  removeInvoiceRecipient: jest.fn(),
  removeInvoiceRecipientEmail: jest.fn(),
  ...overrides,
});

describe('<InvoiceRecipientsList>', () => {
  it('renders one InvoiceRecipient per entry', () => {
    const { getAllByTestId } = render(
      wrap(
        <InvoiceRecipientsList
          {...makeProps({
            invoiceRecipients: [
              { name: 'A', emails: [] },
              { name: 'B', emails: [] },
            ],
          })}
        />
      )
    );
    expect(getAllByTestId('recipient').length).toBe(2);
  });

  it('sorts recipients alphabetically case-insensitively', () => {
    const { getAllByTestId } = render(
      wrap(
        <InvoiceRecipientsList
          {...makeProps({
            invoiceRecipients: [
              { name: 'charlie', emails: [] },
              { name: 'Alice', emails: [] },
              { name: 'bob', emails: [] },
            ],
          })}
        />
      )
    );
    const names = getAllByTestId('recipient').map(n => n.textContent);
    expect(names).toEqual(['Alice', 'bob', 'charlie']);
  });

  it('updates the name input on change', () => {
    const { container } = render(
      wrap(<InvoiceRecipientsList {...makeProps()} />)
    );
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New Name' } });
    expect(input.value).toBe('New Name');
  });

  it('disables the add button when name is empty', () => {
    const { container } = render(
      wrap(<InvoiceRecipientsList {...makeProps()} />)
    );
    const button = container.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('enables the add button once a name is typed', () => {
    const { container } = render(
      wrap(<InvoiceRecipientsList {...makeProps()} />)
    );
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New' } });
    const button = container.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('dispatches addInvoiceRecipient with the typed name on submit', () => {
    const addInvoiceRecipient = jest.fn();
    const { container } = render(
      wrap(
        <InvoiceRecipientsList {...makeProps({ addInvoiceRecipient })} />
      )
    );
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.submit(container.querySelector('form')!);
    expect(addInvoiceRecipient).toHaveBeenCalledWith('New Name');
  });

  it('clears newRecipientName after recipients length grows', () => {
    const { container, rerender } = render(
      wrap(<InvoiceRecipientsList {...makeProps()} />)
    );
    const input = () =>
      container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input(), { target: { value: 'New Name' } });
    expect(input().value).toBe('New Name');
    rerender(
      wrap(
        <InvoiceRecipientsList
          {...makeProps({
            invoiceRecipients: [{ name: 'New Name', emails: [] }],
          })}
        />
      )
    );
    expect(input().value).toBe('');
  });

  it('does not clear newRecipientName when length did not grow', () => {
    const { container, rerender } = render(
      wrap(
        <InvoiceRecipientsList
          {...makeProps({
            invoiceRecipients: [{ name: 'Existing', emails: [] }],
          })}
        />
      )
    );
    const input = () =>
      container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input(), { target: { value: 'Typing' } });
    rerender(
      wrap(
        <InvoiceRecipientsList
          {...makeProps({
            invoiceRecipients: [{ name: 'Existing', emails: [] }],
          })}
        />
      )
    );
    expect(input().value).toBe('Typing');
  });

  it('does not clear newRecipientName when length shrinks', () => {
    const { container, rerender } = render(
      wrap(
        <InvoiceRecipientsList
          {...makeProps({
            invoiceRecipients: [
              { name: 'A', emails: [] },
              { name: 'B', emails: [] },
            ],
          })}
        />
      )
    );
    const input = () =>
      container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input(), { target: { value: 'Typing' } });
    rerender(
      wrap(
        <InvoiceRecipientsList
          {...makeProps({
            invoiceRecipients: [{ name: 'A', emails: [] }],
          })}
        />
      )
    );
    expect(input().value).toBe('Typing');
  });
});
