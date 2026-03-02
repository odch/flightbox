import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';
import DatePicker from './DatePicker';

// Mock the styled DayPicker wrapper (imported as ./DayPicker in DatePicker.js)
jest.mock('./DayPicker', () => {
  const React = require('react');
  const MockDayPicker = ({ onDayClick }) => (
    <div data-testid="day-picker">
      <button
        data-testid="day-picker-day"
        type="button"
        onClick={() => onDayClick && onDayClick(new Date('2024-06-15'))}
      >
        15
      </button>
    </div>
  );
  return MockDayPicker;
});

jest.mock('react-day-picker/moment', () => ({}));

// Mock ModalDialog to render content directly for testability
jest.mock('../ModalDialog', () => {
  const React = require('react');
  const MockModalDialog = ({ content, onBlur }) => (
    <div data-testid="modal-dialog">
      {content}
      <button data-testid="modal-close" type="button" onClick={onBlur}>
        Close
      </button>
    </div>
  );
  return MockModalDialog;
});

describe('DatePicker', () => {
  describe('readOnly mode', () => {
    it('renders formatted date in readOnly mode', () => {
      const { container } = renderWithTheme(
        <DatePicker value="2024-06-15" readOnly={true} />
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('renders in readOnly mode when no value', () => {
      const { container } = renderWithTheme(
        <DatePicker readOnly={true} />
      );
      expect(container.firstChild).toBeTruthy();
    });

    it('does not show picker when readOnly and clicked', () => {
      const { container } = renderWithTheme(
        <DatePicker value="2024-06-15" readOnly={true} />
      );
      // readOnly renders a Wrapper with Value inside, no onClick
      expect(screen.queryByTestId('day-picker')).not.toBeInTheDocument();
    });
  });

  describe('normal mode', () => {
    it('renders without crashing', () => {
      const { container } = renderWithTheme(<DatePicker onChange={jest.fn()} />);
      expect(container.firstChild).toBeTruthy();
    });

    it('shows the picker when the value area is clicked', () => {
      const { container } = renderWithTheme(<DatePicker onChange={jest.fn()} />);
      // container.firstChild = Wrapper div
      // container.firstChild.firstChild = Value div (has onClick={this.showPicker})
      const valueDiv = container.firstChild.firstChild;
      fireEvent.click(valueDiv);
      expect(screen.getByTestId('day-picker')).toBeInTheDocument();
    });

    it('displays formatted date when value is provided', () => {
      renderWithTheme(<DatePicker value="2024-06-15" onChange={jest.fn()} />);
      // The formatted date text should be visible
      expect(screen.getByText(/15/)).toBeInTheDocument();
    });

    it('hides picker after hidePicker is called (modal onBlur)', () => {
      const { container } = renderWithTheme(<DatePicker onChange={jest.fn()} />);
      const valueDiv = container.firstChild.firstChild;
      fireEvent.click(valueDiv);
      expect(screen.getByTestId('day-picker')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('modal-close'));
      expect(screen.queryByTestId('day-picker')).not.toBeInTheDocument();
    });

    it('calls onChange when a day is clicked', () => {
      const onChange = jest.fn();
      const { container } = renderWithTheme(<DatePicker onChange={onChange} />);
      const valueDiv = container.firstChild.firstChild;
      fireEvent.click(valueDiv);

      fireEvent.click(screen.getByTestId('day-picker-day'));
      expect(onChange).toHaveBeenCalledWith({
        value: expect.any(String),
      });
    });

    it('closes picker after day is selected', () => {
      const { container } = renderWithTheme(<DatePicker onChange={jest.fn()} />);
      const valueDiv = container.firstChild.firstChild;
      fireEvent.click(valueDiv);
      expect(screen.getByTestId('day-picker')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('day-picker-day'));
      expect(screen.queryByTestId('day-picker')).not.toBeInTheDocument();
    });

    it('does not call onChange when onChange is not provided', () => {
      const { container } = renderWithTheme(<DatePicker />);
      const valueDiv = container.firstChild.firstChild;
      fireEvent.click(valueDiv);
      expect(screen.getByTestId('day-picker')).toBeInTheDocument();
      // Should not throw when clicking day without onChange
      fireEvent.click(screen.getByTestId('day-picker-day'));
    });
  });

  describe('clearable mode', () => {
    it('renders clear button when clearable and value is set', () => {
      renderWithTheme(
        <DatePicker value="2024-06-15" clearable={true} onChange={jest.fn()} />
      );
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('does not render clear button when not clearable', () => {
      renderWithTheme(
        <DatePicker value="2024-06-15" clearable={false} onChange={jest.fn()} />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not render clear button when no value', () => {
      renderWithTheme(
        <DatePicker clearable={true} onChange={jest.fn()} />
      );
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('clears value when clear button is clicked', () => {
      const onChange = jest.fn();
      renderWithTheme(
        <DatePicker value="2024-06-15" clearable={true} onChange={onChange} />
      );
      fireEvent.click(screen.getByRole('button'));
      expect(onChange).toHaveBeenCalledWith({ value: null });
    });
  });

  describe('prop updates via componentWillReceiveProps', () => {
    it('updates displayed value when value prop changes', () => {
      const { ThemeProvider } = require('styled-components');
      const { BrowserRouter } = require('react-router-dom');
      const { render: rtlRender } = require('@testing-library/react');
      const theme = {
        colors: { main: '#003863', background: '#fafafa', danger: '#e00f00' },
      };
      const wrap = el => (
        <BrowserRouter>
          <ThemeProvider theme={theme}>{el}</ThemeProvider>
        </BrowserRouter>
      );

      const { rerender } = rtlRender(
        wrap(<DatePicker value="2024-01-01" onChange={jest.fn()} />)
      );
      rerender(wrap(<DatePicker value="2024-12-31" onChange={jest.fn()} />));
      expect(screen.getByText(/31/)).toBeInTheDocument();
    });
  });

  describe('dataCy prop', () => {
    it('passes dataCy to the value element', () => {
      const { container } = renderWithTheme(
        <DatePicker onChange={jest.fn()} dataCy="my-date-picker" />
      );
      const valueDiv = container.querySelector('[data-cy="my-date-picker"]');
      expect(valueDiv).toBeInTheDocument();
    });
  });
});
