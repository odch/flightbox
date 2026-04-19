import React from 'react';
import { render, screen } from '@testing-library/react';
import { WizardState } from '../../modules/ui/wizard/reducer';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockGoToPreviousPage = jest.fn();
const mockSubmitPage = jest.fn();
const mockGetNextAction = jest.fn(() => jest.fn());

jest.mock('./useWizardNavigation', () => () => ({
  goToPreviousPage: mockGoToPreviousPage,
  submitPage: mockSubmitPage,
  getNextAction: mockGetNextAction,
}));

jest.mock('../VerticalHeaderLayout', () => {
  return ({ children }: any) => <div data-testid="layout">{children}</div>;
});

jest.mock('./Breadcrumbs', () => {
  return ({ title }: any) => <div data-testid="breadcrumbs">{title}</div>;
});

jest.mock('../Centered', () => {
  return ({ children }: any) => <div data-testid="centered">{children}</div>;
});

jest.mock('../MaterialIcon', () => {
  return () => <span data-testid="material-icon" />;
});

jest.mock('../CommitFailureDialog', () => {
  return ({ errorMsg }: any) => <div data-testid="commit-failure-dialog">{errorMsg}</div>;
});

jest.mock('./WizardDialog', () => {
  return () => <div data-testid="wizard-dialog" />;
});

jest.mock('../../util/reference-number', () => ({
  getFromItemKey: (key: string) => `REF-${key}`,
}));

import MovementWizard from './MovementWizard';

const MockPageComponent = (props: any) => (
  <div
    data-testid="page-component"
    data-readonly={props.readOnly}
    data-is-admin={props.isAdmin}
    data-is-guest={props.isGuest}
  />
);

const MockFinishComponent = (props: any) => (
  <div
    data-testid="finish-component"
    data-is-update={props.isUpdate}
    data-heading-type={props.headingType}
  />
);

const createProps = (overrides: any = {}) => ({
  pages: overrides.pages || [
    { component: MockPageComponent, label: 'Aircraft' },
    { component: MockPageComponent, label: 'Pilot' },
  ],
  finishComponentClass: overrides.finishComponentClass || MockFinishComponent,
  wizard: overrides.wizard || {
    initialized: true,
    page: 1,
    committed: false,
    values: { immatriculation: 'HBABC' },
    commitError: null,
    dialogs: {},
  } as WizardState,
  match: overrides.match || { params: {} },
  auth: overrides.auth || { data: { admin: false, guest: false } },
  newMovementLabel: overrides.newMovementLabel || 'New Departure',
  updateMovementLabel: overrides.updateMovementLabel || 'Edit Departure',
  lockDateLoading: overrides.lockDateLoading ?? false,
  locked: overrides.locked ?? false,

  initNewMovement: overrides.initNewMovement || jest.fn(),
  editMovement: overrides.editMovement || jest.fn(),
  initMovement: overrides.initMovement !== undefined ? overrides.initMovement : null,
  updateValues: overrides.updateValues || jest.fn(),
  nextPage: overrides.nextPage || jest.fn(),
  previousPage: overrides.previousPage || jest.fn(),
  cancel: overrides.cancel || jest.fn(),
  finish: overrides.finish || jest.fn(),
  showDialog: overrides.showDialog || jest.fn(),
  hideDialog: overrides.hideDialog || jest.fn(),
  saveMovement: overrides.saveMovement || jest.fn(),
  unsetCommitError: overrides.unsetCommitError || jest.fn(),
  loadLockDate: overrides.loadLockDate || jest.fn(),
  loadAircraftSettings: overrides.loadAircraftSettings || jest.fn(),
});

describe('MovementWizard', () => {
  describe('initialization', () => {
    it('calls loadLockDate and loadAircraftSettings on mount', () => {
      const loadLockDate = jest.fn();
      const loadAircraftSettings = jest.fn();
      render(<MovementWizard {...createProps({ loadLockDate, loadAircraftSettings })} />);

      expect(loadLockDate).toHaveBeenCalled();
      expect(loadAircraftSettings).toHaveBeenCalled();
    });

    it('calls initNewMovement when no key and no initMovement', () => {
      const initNewMovement = jest.fn();
      render(<MovementWizard {...createProps({ initNewMovement })} />);

      expect(initNewMovement).toHaveBeenCalled();
    });

    it('calls editMovement with key when match.params.key is set', () => {
      const editMovement = jest.fn();
      render(<MovementWizard {...createProps({
        editMovement,
        match: { params: { key: 'abc123' } },
      })} />);

      expect(editMovement).toHaveBeenCalledWith('abc123');
    });

    it('calls initMovement when provided as a function', () => {
      const initMovement = jest.fn();
      const initNewMovement = jest.fn();
      const editMovement = jest.fn();
      render(<MovementWizard {...createProps({
        initMovement,
        initNewMovement,
        editMovement,
      })} />);

      expect(initMovement).toHaveBeenCalled();
      expect(initNewMovement).not.toHaveBeenCalled();
      expect(editMovement).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('shows loading text when wizard is not initialized', () => {
      render(<MovementWizard {...createProps({
        wizard: { initialized: false, page: 1, committed: false, values: {}, commitError: null, dialogs: {} },
      })} />);

      expect(screen.getByText('wizard.loading')).toBeTruthy();
    });

    it('shows loading text when lockDateLoading is true', () => {
      render(<MovementWizard {...createProps({ lockDateLoading: true })} />);

      expect(screen.getByText('wizard.loading')).toBeTruthy();
    });
  });

  describe('breadcrumbs', () => {
    it('shows breadcrumbs when initialized and not committed', () => {
      render(<MovementWizard {...createProps()} />);

      expect(screen.getByTestId('breadcrumbs')).toBeTruthy();
    });

    it('hides breadcrumbs when not initialized', () => {
      render(<MovementWizard {...createProps({
        wizard: { initialized: false, page: 1, committed: false, values: {}, commitError: null, dialogs: {} },
      })} />);

      expect(screen.queryByTestId('breadcrumbs')).toBeNull();
    });

    it('hides breadcrumbs when committed', () => {
      render(<MovementWizard {...createProps({
        wizard: { initialized: true, page: 1, committed: true, values: {}, commitError: null, dialogs: {} },
      })} />);

      expect(screen.queryByTestId('breadcrumbs')).toBeNull();
    });

    it('shows new movement label when no key', () => {
      render(<MovementWizard {...createProps({ newMovementLabel: 'New Arrival' })} />);

      expect(screen.getByTestId('breadcrumbs').textContent).toBe('New Arrival');
    });

    it('shows update movement label with reference when key is set', () => {
      render(<MovementWizard {...createProps({
        match: { params: { key: 'dep123' } },
        updateMovementLabel: 'Edit Departure',
      })} />);

      expect(screen.getByTestId('breadcrumbs').textContent).toBe('Edit Departure (REF-dep123)');
    });
  });

  describe('committed state', () => {
    it('renders finish component with CREATED for new movement', () => {
      render(<MovementWizard {...createProps({
        wizard: { initialized: true, page: 1, committed: true, values: {}, commitError: null, dialogs: {} },
      })} />);

      const finish = screen.getByTestId('finish-component');
      expect(finish.getAttribute('data-is-update')).toBe('false');
      expect(finish.getAttribute('data-heading-type')).toBe('CREATED');
    });

    it('renders finish component with UPDATED for existing movement', () => {
      render(<MovementWizard {...createProps({
        match: { params: { key: 'dep123' } },
        wizard: { initialized: true, page: 1, committed: true, values: {}, commitError: null, dialogs: {} },
      })} />);

      const finish = screen.getByTestId('finish-component');
      expect(finish.getAttribute('data-is-update')).toBe('true');
      expect(finish.getAttribute('data-heading-type')).toBe('UPDATED');
    });
  });

  describe('active page state', () => {
    it('renders the current page component', () => {
      render(<MovementWizard {...createProps()} />);

      expect(screen.getByTestId('page-component')).toBeTruthy();
    });

    it('passes correct props to page component', () => {
      render(<MovementWizard {...createProps({
        locked: true,
        auth: { data: { admin: true, guest: false } },
      })} />);

      const page = screen.getByTestId('page-component');
      expect(page.getAttribute('data-readonly')).toBe('true');
      expect(page.getAttribute('data-is-admin')).toBe('true');
      expect(page.getAttribute('data-is-guest')).toBe('false');
    });
  });

  describe('commit error', () => {
    it('renders CommitFailureDialog when commitError is set', () => {
      render(<MovementWizard {...createProps({
        wizard: {
          initialized: true, page: 1, committed: false, values: {},
          commitError: { message: 'Save failed' }, dialogs: {},
        },
      })} />);

      const dialog = screen.getByTestId('commit-failure-dialog');
      expect(dialog.textContent).toBe('Save failed');
    });

    it('does not render CommitFailureDialog when commitError is null', () => {
      render(<MovementWizard {...createProps()} />);

      expect(screen.queryByTestId('commit-failure-dialog')).toBeNull();
    });
  });
});
