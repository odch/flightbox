import React from 'react';
import { renderWithTheme, screen } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  withTranslation: () => Component => {
    const WrappedComponent = props => <Component {...props} t={key => key} />;
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
  Trans: ({ i18nKey }) => i18nKey,
}));

jest.mock('../../util/flightTypes', () => ({
  getLabel: jest.fn(type => type),
}));

jest.mock('../../util/routes', () => ({
  getDepartureRouteLabel: jest.fn(route => route),
  getArrivalRouteLabel: jest.fn(route => route),
}));

jest.mock('../../util/paymentMethods', () => ({
  getLabel: jest.fn(method => (method ? JSON.stringify(method) : '')),
}));

jest.mock('./HomeBaseIcon', () => {
  const React = require('react');
  return function MockHomeBaseIcon({ isHomeBase, showText }) {
    return (
      <span
        data-testid="home-base-icon"
        data-ishomebase={isHomeBase}
        data-showtext={showText}
      />
    );
  };
});

jest.mock('./DetailsBox', () => {
  const React = require('react');
  return function MockDetailsBox({ label, children }) {
    return (
      <div data-testid="details-box" data-label={label}>
        {children}
      </div>
    );
  };
});

jest.mock('./MovementField', () => {
  const React = require('react');
  return function MockMovementField({ label, value }) {
    return (
      <div data-testid="movement-field" data-label={label}>
        {value}
      </div>
    );
  };
});

jest.mock('./NoPaymentFieldValue', () => {
  const React = require('react');
  return function MockNoPaymentFieldValue({ arrivalId }) {
    return <span data-testid="no-payment-field-value" data-arrival={arrivalId} />;
  };
});

jest.mock('../../util/locationDisplay', () => ({
  formatLocationDisplay: jest.fn(() => 'LSZH'),
}));

import MovementDetails from './MovementDetails';

beforeEach(() => {
  global.__CONF__ = {
    aerodrome: { ICAO: 'LSZT', name: 'Speck-Fehraltorf' },
    homebasePayment: false,
    memberManagement: false,
    maskContactInformation: false,
  };
});

const baseDepartureData = {
  key: 'dep-1',
  type: 'departure',
  immatriculation: 'HB-ABC',
  aircraftType: 'C172',
  mtow: 1100,
  date: '2024-01-15',
  time: '10:00',
  location: 'LSZH',
  lastname: 'Muster',
  firstname: 'Hans',
  email: 'hans@example.com',
  phone: '+41 79 123 45 67',
  passengerCount: 2,
  flightType: 'private',
  runway: '26',
  departureRoute: 'standard',
  route: 'LSZT LSZH',
  remarks: 'none',
};

const baseArrivalData = {
  key: 'arr-1',
  type: 'arrival',
  immatriculation: 'HB-XYZ',
  aircraftType: 'PA28',
  mtow: 1200,
  date: '2024-01-15',
  time: '11:00',
  location: 'LSZB',
  lastname: 'Mueller',
  firstname: 'Anna',
  email: 'anna@example.com',
  phone: '+41 76 987 65 43',
  passengerCount: 1,
  landingCount: 1,
  goAroundCount: 0,
  flightType: 'private',
  runway: '10',
  arrivalRoute: 'standard',
  remarks: '',
};

describe('MovementDetails', () => {
  it('renders without crashing for departure', () => {
    const { container } = renderWithTheme(
      <MovementDetails
        data={baseDepartureData}
        isHomeBase={false}
        isAdmin={false}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders without crashing for arrival', () => {
    const { container } = renderWithTheme(
      <MovementDetails
        data={baseArrivalData}
        isHomeBase={false}
        isAdmin={false}
      />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders details boxes', () => {
    renderWithTheme(
      <MovementDetails
        data={baseDepartureData}
        isHomeBase={false}
        isAdmin={false}
      />
    );
    expect(screen.getAllByTestId('details-box').length).toBeGreaterThan(0);
  });

  it('shows movement fields for departure', () => {
    renderWithTheme(
      <MovementDetails
        data={baseDepartureData}
        isHomeBase={false}
        isAdmin={false}
      />
    );
    const fields = screen.getAllByTestId('movement-field');
    expect(fields.length).toBeGreaterThan(0);
  });

  it('shows carriageVoucher field for departure', () => {
    renderWithTheme(
      <MovementDetails
        data={baseDepartureData}
        isHomeBase={false}
        isAdmin={false}
      />
    );
    const fields = screen.getAllByTestId('movement-field');
    const labels = fields.map(f => f.getAttribute('data-label'));
    expect(labels).toContain('movement.details.carriageVoucher');
  });

  it('shows landing count for arrival', () => {
    renderWithTheme(
      <MovementDetails
        data={baseArrivalData}
        isHomeBase={false}
        isAdmin={false}
      />
    );
    const fields = screen.getAllByTestId('movement-field');
    const labels = fields.map(f => f.getAttribute('data-label'));
    expect(labels).toContain('movement.details.landingCount');
  });

  it('shows fees section when landingFeeTotal is defined on arrival', () => {
    renderWithTheme(
      <MovementDetails
        data={{ ...baseArrivalData, landingFeeTotal: 50 }}
        isHomeBase={false}
        isAdmin={false}
      />
    );
    const fields = screen.getAllByTestId('movement-field');
    const labels = fields.map(f => f.getAttribute('data-label'));
    expect(labels).toContain('movement.details.landingFee');
  });

  it('does not show fees section for departure', () => {
    renderWithTheme(
      <MovementDetails
        data={{ ...baseDepartureData, landingFeeTotal: 50 }}
        isHomeBase={false}
        isAdmin={false}
      />
    );
    const fields = screen.getAllByTestId('movement-field');
    const labels = fields.map(f => f.getAttribute('data-label'));
    expect(labels).not.toContain('movement.details.landingFee');
  });

  it('shows payment method field when payment is pending and isHomeBase false', () => {
    renderWithTheme(
      <MovementDetails
        data={{
          ...baseArrivalData,
          landingFeeTotal: 50,
          paymentMethod: { status: 'pending' },
        }}
        isHomeBase={false}
        isAdmin={false}
      />
    );
    const fields = screen.getAllByTestId('movement-field');
    const labels = fields.map(f => f.getAttribute('data-label'));
    expect(labels).toContain('movement.details.paymentMethod');
  });

  it('shows memberNr when memberManagement is enabled', () => {
    global.__CONF__ = {
      ...global.__CONF__,
      memberManagement: true,
    };
    renderWithTheme(
      <MovementDetails
        data={baseDepartureData}
        isHomeBase={false}
        isAdmin={false}
      />
    );
    const fields = screen.getAllByTestId('movement-field');
    const labels = fields.map(f => f.getAttribute('data-label'));
    expect(labels).toContain('movement.details.memberNr');
  });

  it('shows feeTotalGross formatted as money in landing fee field', () => {
    renderWithTheme(
      <MovementDetails
        data={{
          ...baseArrivalData,
          landingFeeTotal: 50,
          feeTotalGross: 75.5,
        }}
        isHomeBase={false}
        isAdmin={false}
      />
    );
    expect(screen.getByText('CHF 75.50')).toBeInTheDocument();
  });
});
