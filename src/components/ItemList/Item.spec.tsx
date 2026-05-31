import React from 'react';
import { renderWithTheme, fireEvent, screen } from '../../../test/renderWithTheme';
import Item from './Item';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) =>
      opts && opts.name ? `${key}:${opts.name}` : key,
  }),
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

describe('ItemList/Item', () => {
  it('renders the item name', () => {
    renderWithTheme(<Item name="HBKOF" onRemoveClick={jest.fn()}/>);
    expect(screen.getByText('HBKOF')).toBeInTheDocument();
  });

  it('does not show the confirmation dialog initially', () => {
    renderWithTheme(<Item name="HBKOF" onRemoveClick={jest.fn()}/>);
    expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
  });

  it('opens the confirmation dialog on remove click without removing yet', () => {
    const onRemoveClick = jest.fn();
    renderWithTheme(<Item name="HBKOF" onRemoveClick={onRemoveClick}/>);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
    expect(screen.getByText('common.deleteConfirm:HBKOF')).toBeInTheDocument();
    expect(onRemoveClick).not.toHaveBeenCalled();
  });

  it('removes the item when the deletion is confirmed', () => {
    const onRemoveClick = jest.fn();
    renderWithTheme(<Item name="HBKOF" onRemoveClick={onRemoveClick}/>);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByTestId('confirm'));
    expect(onRemoveClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
  });

  it('keeps the item when the deletion is cancelled', () => {
    const onRemoveClick = jest.fn();
    renderWithTheme(<Item name="HBKOF" onRemoveClick={onRemoveClick}/>);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByTestId('cancel'));
    expect(onRemoveClick).not.toHaveBeenCalled();
    expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument();
  });
});
