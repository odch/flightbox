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

jest.mock('../Button', () => ({
  __esModule: true,
  default: ({ label, onClick }: any) => (
    <button data-testid="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

jest.mock('../ItemList', () => ({
  __esModule: true,
  default: ({ items, newItem, changeNewItem, addItem, placeholder }: any) => (
    <div data-testid="item-list">
      <input
        data-testid="new-item-input"
        value={newItem}
        placeholder={placeholder}
        onChange={e => changeNewItem(e.target.value)}
      />
      <button data-testid="add-item" onClick={() => addItem(newItem)}>
        add
      </button>
      <ul data-testid="items">
        {items.map((item: string) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  ),
}));

jest.mock('../DeleteDialog', () => ({
  __esModule: true,
  default: ({ question, onConfirm, onCancel }: any) => (
    <div data-testid="delete-dialog">
      {question}
      <button data-testid="confirm" onClick={onConfirm}>confirm</button>
      <button data-testid="cancel" onClick={onCancel}>cancel</button>
    </div>
  ),
}));

import InvoiceRecipient from './InvoiceRecipient';

const makeProps = (overrides: any = {}) => ({
  recipient: { name: 'Acme', emails: [] },
  expanded: true,
  onRemove: jest.fn(),
  onAddEmail: jest.fn(),
  onRemoveEmail: jest.fn(),
  onExpandedChange: jest.fn(),
  ...overrides,
});

describe('<InvoiceRecipient>', () => {
  it('renders the recipient name', () => {
    const { container } = render(
      wrap(<InvoiceRecipient {...makeProps()} />)
    );
    expect(container.textContent).toContain('Acme');
  });

  it('toggles expansion on header click', () => {
    const onExpandedChange = jest.fn();
    const { container } = render(
      wrap(
        <InvoiceRecipient
          {...makeProps({ expanded: false, onExpandedChange })}
        />
      )
    );
    const header = container.querySelector('div[class]')!.firstChild as HTMLElement;
    fireEvent.click(header);
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it('shows ItemList only when expanded', () => {
    const { queryByTestId, rerender } = render(
      wrap(<InvoiceRecipient {...makeProps({ expanded: false })} />)
    );
    expect(queryByTestId('item-list')).toBeNull();
    rerender(wrap(<InvoiceRecipient {...makeProps({ expanded: true })} />));
    expect(queryByTestId('item-list')).toBeTruthy();
  });

  it('sorts emails alphabetically case-insensitively', () => {
    const { getByTestId } = render(
      wrap(
        <InvoiceRecipient
          {...makeProps({
            recipient: {
              name: 'Acme',
              emails: ['charlie@x.ch', 'Alice@x.ch', 'bob@x.ch'],
            },
          })}
        />
      )
    );
    const emails = Array.from(
      getByTestId('items').children
    ).map(n => n.textContent);
    expect(emails).toEqual(['Alice@x.ch', 'bob@x.ch', 'charlie@x.ch']);
  });

  it('updates newEmail state on ItemList change', () => {
    const { getByTestId } = render(
      wrap(<InvoiceRecipient {...makeProps()} />)
    );
    const input = getByTestId('new-item-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new@example.ch' } });
    expect(input.value).toBe('new@example.ch');
  });

  it('clears newEmail after emails length grows', () => {
    const { getByTestId, rerender } = render(
      wrap(<InvoiceRecipient {...makeProps()} />)
    );
    const input = () => getByTestId('new-item-input') as HTMLInputElement;
    fireEvent.change(input(), { target: { value: 'new@example.ch' } });
    expect(input().value).toBe('new@example.ch');
    rerender(
      wrap(
        <InvoiceRecipient
          {...makeProps({
            recipient: { name: 'Acme', emails: ['new@example.ch'] },
          })}
        />
      )
    );
    expect(input().value).toBe('');
  });

  it('does not clear newEmail when emails length did not grow', () => {
    const { getByTestId, rerender } = render(
      wrap(
        <InvoiceRecipient
          {...makeProps({
            recipient: { name: 'Acme', emails: ['existing@x.ch'] },
          })}
        />
      )
    );
    const input = () => getByTestId('new-item-input') as HTMLInputElement;
    fireEvent.change(input(), { target: { value: 'typing@x.ch' } });
    rerender(
      wrap(
        <InvoiceRecipient
          {...makeProps({
            recipient: { name: 'Acme', emails: ['existing@x.ch'] },
          })}
        />
      )
    );
    expect(input().value).toBe('typing@x.ch');
  });

  it('does not clear newEmail when emails shrinks', () => {
    const { getByTestId, rerender } = render(
      wrap(
        <InvoiceRecipient
          {...makeProps({
            recipient: { name: 'Acme', emails: ['a@x.ch', 'b@x.ch'] },
          })}
        />
      )
    );
    const input = () => getByTestId('new-item-input') as HTMLInputElement;
    fireEvent.change(input(), { target: { value: 'typing@x.ch' } });
    rerender(
      wrap(
        <InvoiceRecipient
          {...makeProps({
            recipient: { name: 'Acme', emails: ['a@x.ch'] },
          })}
        />
      )
    );
    expect(input().value).toBe('typing@x.ch');
  });

  it('opens delete dialog when delete button clicked', () => {
    const { queryByTestId, getByTestId } = render(
      wrap(<InvoiceRecipient {...makeProps()} />)
    );
    expect(queryByTestId('delete-dialog')).toBeNull();
    fireEvent.click(getByTestId('button'));
    expect(getByTestId('delete-dialog')).toBeTruthy();
  });

  it('dispatches onRemove when delete is confirmed', () => {
    const onRemove = jest.fn();
    const { getByTestId } = render(
      wrap(<InvoiceRecipient {...makeProps({ onRemove })} />)
    );
    fireEvent.click(getByTestId('button'));
    fireEvent.click(getByTestId('confirm'));
    expect(onRemove).toHaveBeenCalled();
  });

  it('closes delete dialog on cancel without calling onRemove', () => {
    const onRemove = jest.fn();
    const { getByTestId, queryByTestId } = render(
      wrap(<InvoiceRecipient {...makeProps({ onRemove })} />)
    );
    fireEvent.click(getByTestId('button'));
    fireEvent.click(getByTestId('cancel'));
    expect(queryByTestId('delete-dialog')).toBeNull();
    expect(onRemove).not.toHaveBeenCalled();
  });
});
