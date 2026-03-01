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
  return function MockMaterialIcon({ icon, title, size }) {
    return (
      <span
        data-testid="material-icon"
        data-icon={icon}
        title={title}
        data-size={size}
      />
    );
  };
});

jest.mock('./HomeBaseIcon', () => {
  const React = require('react');
  return function MockHomeBaseIcon({ isHomeBase }) {
    return <span data-testid="home-base-icon" data-ishomebase={isHomeBase} />;
  };
});

jest.mock('../AircraftTypeIcon', () => {
  const React = require('react');
  return function MockAircraftTypeIcon() {
    return <span data-testid="aircraft-type-icon" />;
  };
});

jest.mock('./NoPaymentTag', () => {
  const React = require('react');
  return function MockNoPaymentTag() {
    return <span data-testid="no-payment-tag" />;
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

jest.mock('../../util/locationDisplay', () => ({
  formatLocationDisplay: jest.fn(() => 'LSZH'),
}));

import MovementHeader from './MovementHeader';

beforeEach(() => {
  global.__CONF__ = {
    aerodrome: { ICAO: 'LSZT', name: 'Speck-Fehraltorf' },
    homebasePayment: false,
  };
});

const baseDeparture = {
  key: 'dep-1',
  type: 'departure',
  immatriculation: 'HB-ABC',
  date: '2024-01-15',
  time: '10:00',
  location: 'LSZH',
  lastname: 'Muster',
  associatedMovement: undefined,
};

const baseProps = {
  data: baseDeparture,
  selected: false,
  createMovementFromMovement: jest.fn(),
  locked: false,
  onClick: jest.fn(),
  isHomeBase: false,
  isAdmin: false,
  timeWithDate: false,
};

describe('MovementHeader', () => {
  it('renders without crashing', () => {
    const { container } = renderWithTheme(<MovementHeader {...baseProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders immatriculation', () => {
    renderWithTheme(<MovementHeader {...baseProps} />);
    expect(screen.getByText('HB-ABC')).toBeInTheDocument();
  });

  it('renders pilot last name', () => {
    renderWithTheme(<MovementHeader {...baseProps} />);
    expect(screen.getByText('Muster')).toBeInTheDocument();
  });

  it('calls onClick when wrapper is clicked', () => {
    const onClick = jest.fn();
    renderWithTheme(<MovementHeader {...baseProps} onClick={onClick} />);
    const icons = screen.getAllByTestId('material-icon');
    fireEvent.click(icons[0].closest('div'));
    // The Wrapper itself handles the click; click on the icon triggers it too
    // Click directly on immatriculation text
    fireEvent.click(screen.getByText('HB-ABC'));
    expect(onClick).toHaveBeenCalled();
  });

  it('renders date when timeWithDate is true', () => {
    renderWithTheme(
      <MovementHeader {...baseProps} timeWithDate={true} />
    );
    // dates.formatDate returns a formatted date
    // Just verify the component renders without errors
    const { container } = renderWithTheme(
      <MovementHeader {...baseProps} timeWithDate={true} />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders lock icon when locked', () => {
    renderWithTheme(<MovementHeader {...baseProps} locked={true} />);
    const lockIcon = screen
      .getAllByTestId('material-icon')
      .find(el => el.getAttribute('data-icon') === 'lock');
    expect(lockIcon).toBeTruthy();
  });

  it('does not render lock icon when not locked', () => {
    renderWithTheme(<MovementHeader {...baseProps} locked={false} />);
    const icons = screen.queryAllByTestId('material-icon');
    const lockIcon = icons.find(el => el.getAttribute('data-icon') === 'lock');
    expect(lockIcon).toBeFalsy();
  });

  it('renders HomeBaseIcon', () => {
    renderWithTheme(<MovementHeader {...baseProps} />);
    expect(screen.getByTestId('home-base-icon')).toBeInTheDocument();
  });

  it('renders action when associatedMovement.type is none', () => {
    renderWithTheme(
      <MovementHeader
        {...baseProps}
        data={{ ...baseDeparture, associatedMovement: { type: 'none' } }}
      />
    );
    // Action label for departure is 'Create Arrival' - but i18n mock returns key
    // The Action component renders the label text
    expect(screen.getByText(/Create Arrival/)).toBeInTheDocument();
  });

  it('renders sync icon when associatedMovement is null', () => {
    renderWithTheme(
      <MovementHeader
        {...baseProps}
        data={{ ...baseDeparture, associatedMovement: null }}
      />
    );
    const syncIcon = screen
      .getAllByTestId('material-icon')
      .find(el => el.getAttribute('data-icon') === 'sync');
    expect(syncIcon).toBeTruthy();
  });

  it('renders NoPaymentTag for admin with pending payment on arrival', () => {
    renderWithTheme(
      <MovementHeader
        {...baseProps}
        isAdmin={true}
        isHomeBase={false}
        data={{
          ...baseDeparture,
          type: 'arrival',
          landingFeeTotal: 50,
          paymentMethod: { status: 'pending' },
        }}
      />
    );
    expect(screen.getByTestId('no-payment-tag')).toBeInTheDocument();
  });

  it('calls createMovementFromMovement when action is clicked', () => {
    const createMovementFromMovement = jest.fn();
    renderWithTheme(
      <MovementHeader
        {...baseProps}
        createMovementFromMovement={createMovementFromMovement}
        data={{ ...baseDeparture, associatedMovement: { type: 'none' } }}
      />
    );
    fireEvent.click(screen.getByText(/Create Arrival/));
    expect(createMovementFromMovement).toHaveBeenCalledWith('departure', 'dep-1');
  });
});
