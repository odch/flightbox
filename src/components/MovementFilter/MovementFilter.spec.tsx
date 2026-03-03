import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  withTranslation: () => Component => Component,
  Trans: ({ i18nKey }) => i18nKey,
}));

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({ icon }) {
    return <span data-testid="material-icon" data-icon={icon} />;
  };
});

jest.mock('../Button', () => {
  const React = require('react');
  return function MockButton({ label, onClick, icon, danger, flat }) {
    return (
      <button
        data-testid="filter-button"
        onClick={onClick}
        data-danger={danger}
      >
        {label}
      </button>
    );
  };
});

jest.mock('../DatePicker', () => {
  const React = require('react');
  return function MockDatePicker({ value, onChange, clearable }) {
    return (
      <input
        data-testid="date-picker"
        type="text"
        value={value || ''}
        onChange={e => onChange({ value: e.target.value })}
      />
    );
  };
});

jest.mock('../Input', () => {
  const React = require('react');
  return function MockInput({ value, onChange, type, checked, disabled }) {
    if (type === 'checkbox') {
      return (
        <input
          data-testid="checkbox-input"
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
      );
    }
    return (
      <input
        data-testid="text-input"
        type={type || 'text'}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
      />
    );
  };
});

jest.mock('../LabeledComponent', () => {
  const React = require('react');
  return function MockLabeledComponent({ label, component, validationError }) {
    return (
      <div>
        <label>{label}</label>
        {component}
        {validationError && (
          <span data-testid="validation-error">{validationError}</span>
        )}
      </div>
    );
  };
});

import MovementFilter from './MovementFilter';

const emptyFilter = {
  date: { start: null, end: null },
  immatriculation: '',
  onlyWithoutAssociatedMovement: false,
};

const baseProps = {
  filter: emptyFilter,
  expanded: false,
  setExpanded: jest.fn(),
  setMovementsFilter: jest.fn(),
};

describe('MovementFilter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = renderWithTheme(<MovementFilter {...baseProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the filter button', () => {
    renderWithTheme(<MovementFilter {...baseProps} />);
    expect(screen.getByTestId('filter-button')).toBeInTheDocument();
  });

  it('shows filter label when no date filter is active', () => {
    renderWithTheme(<MovementFilter {...baseProps} />);
    expect(
      screen.getByText('movement.filter.label')
    ).toBeInTheDocument();
  });

  it('shows active label when date filter is set', () => {
    renderWithTheme(
      <MovementFilter
        {...baseProps}
        filter={{
          ...emptyFilter,
          date: { start: 1700000000000, end: 1700100000000 },
        }}
      />
    );
    expect(screen.getByText('movement.filter.active')).toBeInTheDocument();
  });

  it('does not show date pickers when collapsed', () => {
    renderWithTheme(<MovementFilter {...baseProps} expanded={false} />);
    expect(screen.queryAllByTestId('date-picker')).toHaveLength(0);
  });

  it('shows date pickers when expanded', () => {
    renderWithTheme(<MovementFilter {...baseProps} expanded={true} />);
    expect(screen.getAllByTestId('date-picker')).toHaveLength(2);
  });

  it('shows clear button when expanded', () => {
    renderWithTheme(<MovementFilter {...baseProps} expanded={true} />);
    const clearIcon = screen.getByTestId('material-icon');
    expect(clearIcon.getAttribute('data-icon')).toBe('clear');
  });

  it('shows clear button when date filter is set even if collapsed', () => {
    renderWithTheme(
      <MovementFilter
        {...baseProps}
        expanded={false}
        filter={{
          ...emptyFilter,
          date: { start: 1700000000000, end: 1700100000000 },
        }}
      />
    );
    expect(screen.getByTestId('material-icon')).toBeInTheDocument();
  });

  it('calls setExpanded when filter button is clicked', () => {
    const setExpanded = jest.fn();
    renderWithTheme(
      <MovementFilter {...baseProps} expanded={false} setExpanded={setExpanded} />
    );
    fireEvent.click(screen.getByTestId('filter-button'));
    expect(setExpanded).toHaveBeenCalledWith(true);
  });

  it('toggles expanded from true to false', () => {
    const setExpanded = jest.fn();
    renderWithTheme(
      <MovementFilter {...baseProps} expanded={true} setExpanded={setExpanded} />
    );
    fireEvent.click(screen.getByTestId('filter-button'));
    expect(setExpanded).toHaveBeenCalledWith(false);
  });

  it('calls setMovementsFilter with reset values when clear button is clicked', () => {
    const setMovementsFilter = jest.fn();
    renderWithTheme(
      <MovementFilter
        {...baseProps}
        expanded={true}
        setMovementsFilter={setMovementsFilter}
      />
    );
    const clearBtn = screen.getByTestId('material-icon').closest('button');
    fireEvent.click(clearBtn!);
    expect(setMovementsFilter).toHaveBeenCalledWith({
      date: { start: null, end: null },
      immatriculation: '',
      onlyWithoutAssociatedMovement: false,
    });
  });

  it('shows checkbox when expanded', () => {
    renderWithTheme(<MovementFilter {...baseProps} expanded={true} />);
    expect(screen.getByTestId('checkbox-input')).toBeInTheDocument();
  });

  it('shows immatriculation input when expanded', () => {
    renderWithTheme(<MovementFilter {...baseProps} expanded={true} />);
    expect(screen.getByTestId('text-input')).toBeInTheDocument();
  });

  it('shows start date required error when only end date is set', () => {
    renderWithTheme(
      <MovementFilter
        {...baseProps}
        expanded={true}
        filter={{
          ...emptyFilter,
          date: { start: null, end: 1700100000000 },
        }}
      />
    );
    expect(
      screen.getByText('movement.filter.startDateRequired')
    ).toBeInTheDocument();
  });

  it('shows end date required error when only start date is set', () => {
    renderWithTheme(
      <MovementFilter
        {...baseProps}
        expanded={true}
        filter={{
          ...emptyFilter,
          date: { start: 1700000000000, end: null },
        }}
      />
    );
    expect(
      screen.getByText('movement.filter.endDateRequired')
    ).toBeInTheDocument();
  });
});
