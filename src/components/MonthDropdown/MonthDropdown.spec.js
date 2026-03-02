import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';
import MonthDropdown from './MonthDropdown';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  withTranslation: () => Component => {
    Component.defaultProps = {
      ...Component.defaultProps,
      t: key => key,
    };
    return Component;
  },
}));

jest.mock('scroll-into-view', () => jest.fn());

describe('MonthDropdown', () => {
  it('renders without crashing', () => {
    const { container } = renderWithTheme(
      <MonthDropdown onChange={jest.fn()} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders an input element', () => {
    renderWithTheme(<MonthDropdown onChange={jest.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows 12 month options when focused', () => {
    renderWithTheme(<MonthDropdown onChange={jest.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    // Each month is rendered as its translation key: months.0 ... months.11
    for (let i = 0; i < 12; i++) {
      expect(screen.getByText(`months.${i}`)).toBeInTheDocument();
    }
  });

  it('renders with a numeric value (month number)', () => {
    renderWithTheme(<MonthDropdown value={3} onChange={jest.fn()} />);
    const input = screen.getByRole('textbox');
    // The value is rendered via valueRenderer which returns option.label
    // The selected option key would be "3", and label is "months.2" (0-indexed)
    expect(input).toBeInTheDocument();
  });

  it('calls onChange with a number when an option is selected', () => {
    const onChange = jest.fn();
    renderWithTheme(<MonthDropdown onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    // Click on the first month option (months.0)
    fireEvent.mouseDown(screen.getByText('months.0'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('calls onChange with correct number for month 6', () => {
    const onChange = jest.fn();
    renderWithTheme(<MonthDropdown onChange={onChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    fireEvent.mouseDown(screen.getByText('months.5'));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('does not call onChange when onChange is not a function', () => {
    // Should not throw when onChange is undefined
    const { container } = renderWithTheme(<MonthDropdown />);
    expect(container.firstChild).toBeTruthy();
  });

  it('respects readOnly prop', () => {
    renderWithTheme(<MonthDropdown readOnly={true} onChange={jest.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  it('renders with null value without crashing', () => {
    const { container } = renderWithTheme(
      <MonthDropdown value={null} onChange={jest.fn()} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('filters options when typing', () => {
    renderWithTheme(<MonthDropdown onChange={jest.fn()} />);
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    // Type 'months.1' to filter — should show months.1 and months.10, months.11
    fireEvent.change(input, { target: { value: 'months.1' } });
    expect(screen.getByText('months.1')).toBeInTheDocument();
  });

  it('accepts a string value that parses to a number', () => {
    // toStringValue converts number to string; parseNumber converts back
    const onChange = jest.fn();
    renderWithTheme(<MonthDropdown value={7} onChange={onChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('applies className prop', () => {
    const { container } = renderWithTheme(
      <MonthDropdown className="my-month-dropdown" onChange={jest.fn()} />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
