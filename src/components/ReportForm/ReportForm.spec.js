import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  withTranslation: () => Component => Component,
  Trans: ({ i18nKey }) => i18nKey,
}));

jest.mock('../Input', () => {
  const React = require('react');
  return function MockInput({ type, value, onChange, disabled }) {
    return (
      <input
        data-testid={type === 'number' ? 'year-input' : 'input'}
        type={type || 'text'}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  };
});

jest.mock('../Button', () => {
  const React = require('react');
  return function MockButton({ label, type, disabled, icon, primary }) {
    return (
      <button
        data-testid="submit-button"
        type={type || 'button'}
        disabled={disabled}
      >
        {label}
      </button>
    );
  };
});

jest.mock('../LabeledComponent', () => {
  const React = require('react');
  return function MockLabeledComponent({ label, component }) {
    return (
      <div>
        <label>{label}</label>
        {component}
      </div>
    );
  };
});

jest.mock('../MonthDropdown', () => {
  const React = require('react');
  return function MockMonthDropdown({ value, onChange }) {
    return (
      <select
        data-testid="month-dropdown"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
      >
        <option value="">--</option>
        <option value="1">January</option>
        <option value="6">June</option>
      </select>
    );
  };
});

jest.mock('./DelimiterDropdown', () => {
  const React = require('react');
  return function MockDelimiterDropdown({ value, onChange }) {
    return (
      <select
        data-testid="delimiter-dropdown"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value=",">,</option>
        <option value=";">;</option>
      </select>
    );
  };
});

import ReportForm from './ReportForm';

const baseProps = {
  date: { year: 2024, month: 6 },
  setDate: jest.fn(),
  setDelimiter: jest.fn(),
  generate: jest.fn(),
  disabled: false,
  withMonth: true,
  withDelimiter: true,
};

describe('ReportForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderWithTheme(<ReportForm {...baseProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders year input', () => {
    renderWithTheme(<ReportForm {...baseProps} />);
    expect(screen.getByTestId('year-input')).toBeInTheDocument();
  });

  it('renders month dropdown when withMonth is true', () => {
    renderWithTheme(<ReportForm {...baseProps} withMonth={true} />);
    expect(screen.getByTestId('month-dropdown')).toBeInTheDocument();
  });

  it('does not render month dropdown when withMonth is false', () => {
    renderWithTheme(<ReportForm {...baseProps} withMonth={false} />);
    expect(screen.queryByTestId('month-dropdown')).not.toBeInTheDocument();
  });

  it('renders delimiter dropdown when withDelimiter is true', () => {
    renderWithTheme(<ReportForm {...baseProps} withDelimiter={true} />);
    expect(screen.getByTestId('delimiter-dropdown')).toBeInTheDocument();
  });

  it('does not render delimiter dropdown when withDelimiter is false', () => {
    renderWithTheme(<ReportForm {...baseProps} withDelimiter={false} />);
    expect(screen.queryByTestId('delimiter-dropdown')).not.toBeInTheDocument();
  });

  it('renders submit button with download label', () => {
    renderWithTheme(<ReportForm {...baseProps} />);
    expect(screen.getByText('common.download')).toBeInTheDocument();
  });

  it('disables submit button when no year', () => {
    renderWithTheme(
      <ReportForm {...baseProps} date={{ year: null, month: 6 }} />
    );
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });

  it('disables submit button when no month', () => {
    renderWithTheme(
      <ReportForm {...baseProps} date={{ year: 2024, month: null }} />
    );
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });

  it('enables submit button when year and month are set', () => {
    renderWithTheme(
      <ReportForm {...baseProps} date={{ year: 2024, month: 6 }} />
    );
    expect(screen.getByTestId('submit-button')).not.toBeDisabled();
  });

  it('disables all inputs when disabled prop is true', () => {
    renderWithTheme(<ReportForm {...baseProps} disabled={true} />);
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });

  it('calls generate with date and parameters on submit', () => {
    const generate = jest.fn();
    const { container } = renderWithTheme(
      <ReportForm {...baseProps} generate={generate} parameters={{ foo: 'bar' }} />
    );
    fireEvent.submit(container.querySelector('form'));
    expect(generate).toHaveBeenCalledWith(
      { year: 2024, month: 6 },
      { foo: 'bar' }
    );
  });

  it('calls setDate when year input changes', () => {
    const setDate = jest.fn();
    renderWithTheme(
      <ReportForm {...baseProps} setDate={setDate} />
    );
    fireEvent.change(screen.getByTestId('year-input'), {
      target: { value: '2025' },
    });
    expect(setDate).toHaveBeenCalledWith({ year: 2025, month: 6 });
  });

  it('uses comma as default delimiter when delimiter prop is not provided', () => {
    renderWithTheme(
      <ReportForm {...baseProps} delimiter={undefined} />
    );
    const delimSelect = screen.getByTestId('delimiter-dropdown');
    expect(delimSelect.value).toBe(',');
  });

  it('renders children', () => {
    renderWithTheme(
      <ReportForm {...baseProps}>
        <div data-testid="child-content">Extra content</div>
      </ReportForm>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
