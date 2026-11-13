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
    revokeFailed: false,
    loadPprRequests: jest.fn(),
    reviewPprRequest: jest.fn(),
    revokePprApproval: jest.fn(),
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

  it('does not carry remarks over to another request', () => {
    const otherPending = { ...pendingRequest, key: 'req-3', immatriculation: 'HB-DEF' };
    renderWithTheme(<PprRequestList {...defaultProps} data={[pendingRequest, otherPending]}/>);

    fireEvent.click(screen.getByText('HB-ABC'));
    fireEvent.change(screen.getByPlaceholderText('ppr.adminRemarks'), { target: { value: 'Runway closed for you' } });
    fireEvent.click(screen.getByText('HB-DEF'));

    expect((screen.getByPlaceholderText('ppr.adminRemarks') as HTMLTextAreaElement).value).toBe('');
    fireEvent.click(screen.getByText('ppr.reject'));
    expect(defaultProps.reviewPprRequest).toHaveBeenCalledWith('req-3', 'rejected', undefined);
  });

  it('shows the planned date in the date format of the app', () => {
    renderWithTheme(<PprRequestList {...defaultProps} data={[pendingRequest]} />);
    expect(screen.getByText('15.04.2026 10:30')).toBeTruthy();
  });

  it('opens a request with a button, so it also works with the keyboard', () => {
    renderWithTheme(<PprRequestList {...defaultProps} data={[pendingRequest]} />);
    const toggle = screen.getByRole('button', { name: /HB-ABC/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('max@example.com').closest('a')!.getAttribute('href')).toBe('mailto:max@example.com');
  });

  it('shows review failed error', () => {
    renderWithTheme(
      <PprRequestList {...defaultProps} reviewFailed={true} />
    );
    expect(screen.getByText('ppr.reviewFailed')).toBeTruthy();
  });

  describe('automatic answers', () => {
    const automaticApproval = {
      ...approvedRequest,
      reviewedBy: 'automatic',
      reviewRemarks: 'Runway 05/23, landing fee CHF 20',
    };

    it('shows that a request was answered automatically, with the information for pilots', () => {
      renderWithTheme(<PprRequestList {...defaultProps} data={[automaticApproval]}/>);
      fireEvent.click(screen.getByText('HB-XYZ'));

      expect(screen.getByText('ppr.answeredAutomatically')).toBeTruthy();
      expect(screen.getByText('ppr.pilotInfo')).toBeTruthy();
      expect(screen.getByText('Runway 05/23, landing fee CHF 20')).toBeTruthy();
    });

    it('does not label requests answered by an admin', () => {
      renderWithTheme(<PprRequestList {...defaultProps} data={[{ ...approvedRequest, reviewRemarks: 'Welcome' }]}/>);
      fireEvent.click(screen.getByText('HB-XYZ'));

      expect(screen.queryByText('ppr.answeredAutomatically')).toBeNull();
      expect(screen.getByText('ppr.adminRemarks')).toBeTruthy();
    });
  });

  describe('revoking an approval', () => {
    it('needs a reason', () => {
      renderWithTheme(<PprRequestList {...defaultProps} data={[approvedRequest]}/>);
      fireEvent.click(screen.getByText('HB-XYZ'));

      const revoke = screen.getByText('ppr.revoke').closest('button')!;
      expect(revoke.hasAttribute('disabled')).toBe(true);

      fireEvent.change(screen.getByPlaceholderText('ppr.revokeReason'), { target: { value: '   ' } });
      expect(revoke.hasAttribute('disabled')).toBe(true);
    });

    it('revokes with the trimmed reason', () => {
      renderWithTheme(<PprRequestList {...defaultProps} data={[approvedRequest]}/>);
      fireEvent.click(screen.getByText('HB-XYZ'));

      fireEvent.change(screen.getByPlaceholderText('ppr.revokeReason'), { target: { value: ' Runway works ' } });
      fireEvent.click(screen.getByText('ppr.revoke'));

      expect(defaultProps.revokePprApproval).toHaveBeenCalledWith('req-2', 'Runway works');
    });

    it.each(['pending', 'rejected', 'revoked'])('cannot revoke a %s request', status => {
      renderWithTheme(<PprRequestList {...defaultProps} data={[{ ...approvedRequest, status }]}/>);
      fireEvent.click(screen.getByText('HB-XYZ'));

      expect(screen.queryByText('ppr.revoke')).toBeNull();
    });

    it('shows a revoked request with its reason', () => {
      const revoked = { ...approvedRequest, status: 'revoked', reviewRemarks: 'Runway works' };
      renderWithTheme(<PprRequestList {...defaultProps} data={[revoked]}/>);
      expect(screen.getByText('ppr.status.revoked')).toBeTruthy();

      fireEvent.click(screen.getByText('HB-XYZ'));
      expect(screen.getByText('Runway works')).toBeTruthy();
    });

    it('shows a failed revocation', () => {
      renderWithTheme(<PprRequestList {...defaultProps} revokeFailed={true}/>);
      expect(screen.getByText('ppr.revokeFailed')).toBeTruthy();
    });
  });
});
