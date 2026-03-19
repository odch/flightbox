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

jest.mock('../VerticalHeaderLayout', () => {
  const React = require('react');
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

jest.mock('../JumpNavigation', () => {
  const React = require('react');
  return function MockJumpNav() {
    return <div data-testid="jump-nav" />;
  };
});

jest.mock('../ModalDialog', () => {
  const React = require('react');
  return function MockModalDialog({ content }) {
    return <div data-testid="modal-dialog">{content}</div>;
  };
});

import PprStatusList from './PprStatusList';

const pendingRequest = {
  key: 'req-1',
  immatriculation: 'HB-ABC',
  firstname: 'Max',
  lastname: 'Muster',
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
};

const rejectedRequest = {
  ...pendingRequest,
  key: 'req-3',
  status: 'rejected',
  reviewRemarks: 'Bad weather',
};

describe('PprStatusList', () => {
  const defaultProps = {
    data: [],
    loading: false,
    deleteFailed: false,
    loadPprRequests: jest.fn(),
    deletePprRequest: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls loadPprRequests on mount', () => {
    renderWithTheme(<PprStatusList {...defaultProps} />);
    expect(defaultProps.loadPprRequests).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    renderWithTheme(<PprStatusList {...defaultProps} loading={true} />);
    expect(screen.getByText('common.loading')).toBeTruthy();
  });

  it('shows empty message when no requests', () => {
    renderWithTheme(<PprStatusList {...defaultProps} />);
    expect(screen.getByText('ppr.noRequests')).toBeTruthy();
  });

  it('renders request cards', () => {
    renderWithTheme(
      <PprStatusList {...defaultProps} data={[pendingRequest, approvedRequest]} />
    );
    expect(screen.getByText('HB-ABC')).toBeTruthy();
    expect(screen.getByText('ppr.status.pending')).toBeTruthy();
    expect(screen.getByText('ppr.status.approved')).toBeTruthy();
  });

  it('shows delete button only for pending requests', () => {
    renderWithTheme(
      <PprStatusList {...defaultProps} data={[pendingRequest, approvedRequest]} />
    );
    const deleteButtons = screen.getAllByText('common.delete');
    expect(deleteButtons).toHaveLength(1);
  });

  it('shows confirmation dialog before deleting', () => {
    renderWithTheme(
      <PprStatusList {...defaultProps} data={[pendingRequest]} />
    );
    fireEvent.click(screen.getByText('common.delete'));
    expect(screen.getByText('ppr.deleteConfirm')).toBeTruthy();
    expect(defaultProps.deletePprRequest).not.toHaveBeenCalled();
  });

  it('calls deletePprRequest after confirming', () => {
    renderWithTheme(
      <PprStatusList {...defaultProps} data={[pendingRequest]} />
    );
    fireEvent.click(screen.getByText('common.delete'));
    // Click the confirm delete button in the dialog
    const deleteButtons = screen.getAllByText('common.delete');
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    expect(defaultProps.deletePprRequest).toHaveBeenCalledWith('req-1');
  });

  it('shows review remarks for rejected requests', () => {
    renderWithTheme(
      <PprStatusList {...defaultProps} data={[rejectedRequest]} />
    );
    expect(screen.getByText('Bad weather')).toBeTruthy();
  });

  it('shows delete failed error', () => {
    renderWithTheme(
      <PprStatusList {...defaultProps} deleteFailed={true} />
    );
    expect(screen.getByText('ppr.deleteFailed')).toBeTruthy();
  });
});
