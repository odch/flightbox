import React from 'react';
import { renderWithTheme, screen, fireEvent } from '../../../test/renderWithTheme';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
  withTranslation: () => Component => {
    const WrappedComponent = props => <Component {...props} t={key => key} />;
    WrappedComponent.displayName = `withTranslation(${Component.displayName || Component.name})`;
    return WrappedComponent;
  },
}));

jest.mock('../MaterialIcon', () => {
  const React = require('react');
  return function MockMaterialIcon({ icon }) {
    return <span data-testid="material-icon" data-icon={icon} />;
  };
});

import PprRequestList from './PprRequestList';

const pendingRequest = {
  key: 'req-1',
  immatriculation: 'HB-ABC',
  firstname: 'Max',
  lastname: 'Muster',
  email: 'max@example.com',
  plannedDate: '2026-04-15',
  plannedTime: '10:30',
  flightType: 'private',
  status: 'pending',
};

const approvedRequest = {
  ...pendingRequest,
  key: 'req-2',
  immatriculation: 'HB-XYZ',
  status: 'approved',
  reviewedBy: 'admin@aero.ch',
};

describe('PprRequestList (admin)', () => {
  const defaultProps = {
    data: [],
    loading: false,
    reviewFailed: false,
    loadPprRequests: jest.fn(),
    reviewPprRequest: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls loadPprRequests on mount', () => {
    renderWithTheme(<PprRequestList {...defaultProps} />);
    expect(defaultProps.loadPprRequests).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    renderWithTheme(<PprRequestList {...defaultProps} loading={true} />);
    expect(screen.getByText('common.loading')).toBeTruthy();
  });

  it('shows empty message when no requests', () => {
    renderWithTheme(<PprRequestList {...defaultProps} />);
    expect(screen.getByText('ppr.noRequests')).toBeTruthy();
  });

  it('renders request cards with status', () => {
    renderWithTheme(
      <PprRequestList {...defaultProps} data={[pendingRequest, approvedRequest]} />
    );
    expect(screen.getByText('HB-ABC')).toBeTruthy();
    expect(screen.getByText('HB-XYZ')).toBeTruthy();
    expect(screen.getByText('ppr.status.pending')).toBeTruthy();
    expect(screen.getByText('ppr.status.approved')).toBeTruthy();
  });

  it('expands request details on click', () => {
    renderWithTheme(
      <PprRequestList {...defaultProps} data={[pendingRequest]} />
    );
    expect(screen.queryByText('max@example.com')).toBeNull();
    fireEvent.click(screen.getByText('HB-ABC'));
    expect(screen.getByText('max@example.com')).toBeTruthy();
  });

  it('shows approve/reject buttons for pending requests when expanded', () => {
    renderWithTheme(
      <PprRequestList {...defaultProps} data={[pendingRequest]} />
    );
    fireEvent.click(screen.getByText('HB-ABC'));
    expect(screen.getByText('ppr.approve')).toBeTruthy();
    expect(screen.getByText('ppr.reject')).toBeTruthy();
  });

  it('does not show approve/reject for non-pending requests', () => {
    renderWithTheme(
      <PprRequestList {...defaultProps} data={[approvedRequest]} />
    );
    fireEvent.click(screen.getByText('HB-XYZ'));
    expect(screen.queryByText('ppr.approve')).toBeNull();
    expect(screen.queryByText('ppr.reject')).toBeNull();
  });

  it('calls reviewPprRequest with approved status', () => {
    renderWithTheme(
      <PprRequestList {...defaultProps} data={[pendingRequest]} />
    );
    fireEvent.click(screen.getByText('HB-ABC'));
    fireEvent.click(screen.getByText('ppr.approve'));
    expect(defaultProps.reviewPprRequest).toHaveBeenCalledWith('req-1', 'approved', undefined);
  });

  it('calls reviewPprRequest with rejected status and remarks', () => {
    renderWithTheme(
      <PprRequestList {...defaultProps} data={[pendingRequest]} />
    );
    fireEvent.click(screen.getByText('HB-ABC'));
    const textarea = screen.getByPlaceholderText('ppr.adminRemarks');
    fireEvent.change(textarea, { target: { value: 'Bad weather' } });
    fireEvent.click(screen.getByText('ppr.reject'));
    expect(defaultProps.reviewPprRequest).toHaveBeenCalledWith('req-1', 'rejected', 'Bad weather');
  });

  it('shows review failed error', () => {
    renderWithTheme(
      <PprRequestList {...defaultProps} reviewFailed={true} />
    );
    expect(screen.getByText('ppr.reviewFailed')).toBeTruthy();
  });
});
