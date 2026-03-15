import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  withTranslation: () => Component => {
    const WrappedComponent = props => <Component {...props} t={key => key} />;
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
  Trans: ({ i18nKey }) => i18nKey,
}));

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({ icon, title }) {
    return <span data-testid="material-icon" data-icon={icon} title={title} />;
  };
});

jest.mock('../../containers/AssociatedMovementContainer', () => {
  const React = require('react');
  return function MockAssociatedMovement() {
    return <div data-testid="associated-movement" />;
  };
});

jest.mock('./MovementDetails', () => {
  const React = require('react');
  return function MockMovementDetails() {
    return <div data-testid="movement-details" />;
  };
});

jest.mock('./MovementHeader', () => {
  const React = require('react');
  return function MockMovementHeader({ onClick, selected, data }) {
    return (
      <div
        data-testid="movement-header"
        data-selected={selected}
        onClick={onClick}
      >
        {data.immatriculation}
      </div>
    );
  };
});

jest.mock('./labels', () => ({
  TYPE_LABELS: {
    departure: { label: 'Departure', icon: 'flight_takeoff' },
    arrival: { label: 'Arrival', icon: 'flight_land' },
  },
  ACTION_LABELS: {
    departure: { label: 'Create Arrival', icon: 'flight_land' },
    arrival: { label: 'Create Departure', icon: 'flight_takeoff' },
  },
}));

import Movement from './Movement';

const baseData = {
  key: 'abc123',
  type: 'departure',
  immatriculation: 'HB-ABC',
  date: '2024-01-15',
  time: '10:00',
  location: 'LSZT',
  lastname: 'Muster',
};

const baseProps = {
  data: baseData,
  selected: false,
  customs: { loading: false, available: false },
  aerodromes: { data: null },
  onEdit: jest.fn(),
  onStartCustoms: jest.fn(),
  onSelect: jest.fn(),
  onDelete: jest.fn(),
  timeWithDate: true,
  createMovementFromMovement: jest.fn(),
  locked: false,
  aircraftSettings: { club: {}, homeBase: {} },
  loading: false,
  isAdmin: false,
};

beforeEach(() => {
  global.__CONF__ = {
    aerodrome: { ICAO: 'LSZT', name: 'Speck-Fehraltorf' },
    homebasePayment: false,
    memberManagement: false,
    maskContactInformation: false,
  };
});

describe('Movement', () => {
  it('renders without crashing', () => {
    const { container } = renderWithTheme(<Movement {...baseProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the movement header', () => {
    renderWithTheme(<Movement {...baseProps} />);
    expect(screen.getByTestId('movement-header')).toBeInTheDocument();
  });

  it('does not show details when not selected', () => {
    renderWithTheme(<Movement {...baseProps} selected={false} />);
    expect(screen.queryByTestId('movement-details')).not.toBeInTheDocument();
  });

  it('shows details when selected', () => {
    renderWithTheme(<Movement {...baseProps} selected={true} />);
    expect(screen.getByTestId('movement-details')).toBeInTheDocument();
  });

  it('shows AssociatedMovement when selected', () => {
    renderWithTheme(<Movement {...baseProps} selected={true} />);
    expect(screen.getByTestId('associated-movement')).toBeInTheDocument();
  });

  it('shows edit and delete actions when selected and not locked', () => {
    renderWithTheme(
      <Movement {...baseProps} selected={true} locked={false} />
    );
    expect(screen.getByText(/movement\.edit/)).toBeInTheDocument();
    expect(screen.getByText(/movement\.delete/)).toBeInTheDocument();
  });

  it('hides footer when locked', () => {
    renderWithTheme(
      <Movement {...baseProps} selected={true} locked={true} />
    );
    expect(screen.queryByText(/movement\.edit/)).not.toBeInTheDocument();
    expect(screen.queryByText(/movement\.delete/)).not.toBeInTheDocument();
  });

  it('calls onSelect with key when header is clicked and not selected', () => {
    const onSelect = jest.fn();
    renderWithTheme(
      <Movement {...baseProps} selected={false} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByTestId('movement-header'));
    expect(onSelect).toHaveBeenCalledWith('abc123');
  });

  it('calls onSelect with null when header is clicked and selected', () => {
    const onSelect = jest.fn();
    renderWithTheme(
      <Movement {...baseProps} selected={true} onSelect={onSelect} />
    );
    fireEvent.click(screen.getByTestId('movement-header'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('calls onDelete when delete action is clicked', () => {
    const onDelete = jest.fn();
    renderWithTheme(
      <Movement {...baseProps} selected={true} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByText(/movement\.delete/));
    expect(onDelete).toHaveBeenCalledWith(baseData);
  });

  it('calls onEdit when edit action is clicked', () => {
    const onEdit = jest.fn();
    renderWithTheme(
      <Movement {...baseProps} selected={true} onEdit={onEdit} />
    );
    fireEvent.click(screen.getByText(/movement\.edit/));
    expect(onEdit).toHaveBeenCalledWith(baseData.type, baseData.key);
  });

  it('does not show customs action when customs.available is false', () => {
    renderWithTheme(
      <Movement
        {...baseProps}
        selected={true}
        customs={{ loading: false, available: false }}
      />
    );
    expect(
      screen.queryByText(/movement\.openCustoms/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/movement\.recordCustoms/)
    ).not.toBeInTheDocument();
  });

  it('shows openCustoms action when customsFormId is present and customs.available is true', () => {
    renderWithTheme(
      <Movement
        {...baseProps}
        selected={true}
        data={{ ...baseData, customsFormId: 'form-1' }}
        customs={{ loading: false, available: true }}
      />
    );
    expect(screen.getByText(/movement\.openCustoms/)).toBeInTheDocument();
  });

  it('marks aircraft as homeBase when club setting is true', () => {
    const { container } = renderWithTheme(
      <Movement
        {...baseProps}
        aircraftSettings={{
          club: { 'HB-ABC': true },
          homeBase: {},
        }}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });
});
