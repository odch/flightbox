import React from 'react';
import { renderWithTheme, withTheme, screen, fireEvent, within } from '../../../test/renderWithTheme';

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

  it('tells when the requests could not be loaded, instead of that there are none', () => {
    renderWithTheme(<PprRequestList {...defaultProps} loadFailed={true} />);
    expect(screen.getByRole('alert')).toHaveTextContent('ppr.loadFailed');
    expect(screen.queryByText('ppr.noRequests')).toBeNull();
  });

  it('keeps the requests of an earlier load below the error', () => {
    renderWithTheme(<PprRequestList {...defaultProps} data={[pendingRequest]} loadFailed={true} />);
    expect(screen.getByRole('alert')).toHaveTextContent('ppr.loadFailed');
    expect(screen.getByText('HB-ABC')).toBeTruthy();
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

  // A double click on "Abbrechen" of the settings above (or a quick one on
  // "Speichern") closes the form, which moves the list up under the pointer
  describe('the further clicks of a double click', () => {
    it('answer no request', () => {
      renderWithTheme(<PprRequestList {...defaultProps} data={[pendingRequest]}/>);
      fireEvent.click(screen.getByText('HB-ABC'));

      fireEvent.click(screen.getByText('ppr.reject'), { detail: 2 });
      fireEvent.click(screen.getByText('ppr.approve'), { detail: 2 });
      fireEvent.click(screen.getByText('ppr.approve'), { detail: 3 });

      expect(defaultProps.reviewPprRequest).not.toHaveBeenCalled();
      expect(screen.getByText('ppr.approve')).toBeTruthy();
    });

    it('revoke no approval', () => {
      renderWithTheme(<PprRequestList {...defaultProps} data={[approvedRequest]}/>);
      fireEvent.click(screen.getByText('HB-XYZ'));
      fireEvent.change(screen.getByPlaceholderText('ppr.revokeReason'), { target: { value: 'Runway works' } });

      fireEvent.click(screen.getByText('ppr.revoke'), { detail: 2 });

      expect(defaultProps.revokePprApproval).not.toHaveBeenCalled();
    });

    it('do not close a request with the remarks typed for it', () => {
      renderWithTheme(<PprRequestList {...defaultProps} data={[pendingRequest]}/>);
      const toggle = screen.getByRole('button', { name: /HB-ABC/ });
      fireEvent.click(toggle, { detail: 1 });
      fireEvent.change(screen.getByPlaceholderText('ppr.adminRemarks'), { target: { value: 'Bad weather' } });

      fireEvent.click(toggle, { detail: 2 });

      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect((screen.getByPlaceholderText('ppr.adminRemarks') as HTMLTextAreaElement).value).toBe('Bad weather');
    });

    it('leave single clicks as they are', () => {
      renderWithTheme(<PprRequestList {...defaultProps} data={[pendingRequest, approvedRequest]}/>);

      fireEvent.click(screen.getByText('HB-ABC'), { detail: 1 });
      fireEvent.click(screen.getByText('ppr.reject'), { detail: 1 });
      expect(defaultProps.reviewPprRequest).toHaveBeenCalledWith('req-1', 'rejected', undefined);

      fireEvent.click(screen.getByText('HB-XYZ'), { detail: 1 });
      fireEvent.change(screen.getByPlaceholderText('ppr.revokeReason'), { target: { value: 'Runway works' } });
      fireEvent.click(screen.getByText('ppr.revoke'), { detail: 1 });
      expect(defaultProps.revokePprApproval).toHaveBeenCalledWith('req-2', 'Runway works');
    });
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

  describe('a linked request (from the notification email)', () => {
    const otherPending = { ...pendingRequest, key: 'req-3', immatriculation: 'HB-DEF' };
    const requests = [otherPending, pendingRequest, approvedRequest];

    // When the list is opened from the link: nothing loaded yet
    const opened = { ...defaultProps, data: [], loaded: false, settingsReady: false };
    // After the load of all requests, with the settings above the list
    const ready = { ...defaultProps, data: requests, loaded: true, settingsReady: true };

    let scrollIntoView: jest.Mock;
    let originalScrollIntoView: any;

    beforeEach(() => {
      // Not in jsdom
      originalScrollIntoView = (HTMLElement.prototype as any).scrollIntoView;
      scrollIntoView = jest.fn();
      (HTMLElement.prototype as any).scrollIntoView = scrollIntoView;
    });

    afterEach(() => {
      (HTMLElement.prototype as any).scrollIntoView = originalScrollIntoView;
    });

    // Renders the list with the given props first, and returns a function
    // that renders it with new props
    const renderList = (linkedKey: string | undefined, props: any) => {
      const utils = renderWithTheme(<PprRequestList {...props} linkedKey={linkedKey}/>);
      const update = (newProps: any) => {
        utils.rerender(withTheme(<PprRequestList {...newProps} linkedKey={linkedKey}/>));
      };
      return { ...utils, update };
    };

    // Opens the list and goes through its load
    const openList = (linkedKey: string | undefined, loadedProps: any = ready) => {
      const utils = renderList(linkedKey, opened);
      utils.update({ ...opened, loading: true });
      utils.update(loadedProps);
      return utils;
    };

    const rowOf = (container: HTMLElement, key: string) =>
      container.querySelector(`[data-cy="ppr-admin-${key}"]`) as HTMLElement;
    const isOpen = (immatriculation: string) =>
      screen.getByRole('button', { name: new RegExp(immatriculation) }).getAttribute('aria-expanded') === 'true';

    it('opens the request and scrolls it into view, ready to be answered', () => {
      const { container } = openList('req-1');

      expect(isOpen('HB-ABC')).toBe(true);
      expect(isOpen('HB-DEF')).toBe(false);
      expect(screen.getByText('ppr.approve')).toBeTruthy();
      expect(screen.getByText('ppr.reject')).toBeTruthy();
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
      expect(scrollIntoView.mock.instances[0]).toBe(rowOf(container, 'req-1'));
      expect(screen.queryByText('ppr.linkedRequestAnswered')).toBeNull();
      expect(screen.queryByText('ppr.linkedRequestMissing')).toBeNull();
    });

    it.each([
      ['a pending', 'req-1'],
      ['an approved', 'req-2'],
      ['a missing', 'gone-key'],
    ])('does nothing but show %s request', (_, key) => {
      openList(key);

      expect(defaultProps.reviewPprRequest).not.toHaveBeenCalled();
      expect(defaultProps.revokePprApproval).not.toHaveBeenCalled();
      expect(defaultProps.loadPprRequests).toHaveBeenCalledTimes(1);
    });

    it('waits for the settings above the list, which would push the row away', () => {
      const { container, update } = openList('req-1', { ...ready, settingsReady: false });
      expect(isOpen('HB-ABC')).toBe(false);
      expect(scrollIntoView).not.toHaveBeenCalled();

      update(ready);
      expect(isOpen('HB-ABC')).toBe(true);
      expect(scrollIntoView.mock.instances[0]).toBe(rowOf(container, 'req-1'));
    });

    it('waits for the list of all requests (not the pilot\'s own)', () => {
      const { update } = openList('req-1', { ...ready, loaded: false });
      expect(isOpen('HB-ABC')).toBe(false);
      expect(scrollIntoView).not.toHaveBeenCalled();

      update({ ...ready, loading: true });
      update(ready);
      expect(isOpen('HB-ABC')).toBe(true);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it('waits for a load since the list was opened, not the requests of an earlier visit', () => {
      const { update } = renderList('req-1', ready);
      expect(isOpen('HB-ABC')).toBe(false);
      expect(scrollIntoView).not.toHaveBeenCalled();

      update({ ...ready, loading: true });
      expect(scrollIntoView).not.toHaveBeenCalled();

      update(ready);
      expect(isOpen('HB-ABC')).toBe(true);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it('opens the request only once, not again after a reload', () => {
      const { update } = openList('req-1');
      fireEvent.click(screen.getByText('HB-ABC'));
      expect(isOpen('HB-ABC')).toBe(false);

      update({ ...ready, loading: true });
      update({ ...ready, data: [...requests] });
      expect(isOpen('HB-ABC')).toBe(false);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it('opens the request without the remarks typed for another one', () => {
      const { update } = renderList('req-1', ready);
      fireEvent.click(screen.getByText('HB-DEF'));
      fireEvent.change(screen.getByPlaceholderText('ppr.adminRemarks'), { target: { value: 'Runway closed for you' } });

      update({ ...ready, loading: true });
      update(ready);
      expect(isOpen('HB-ABC')).toBe(true);
      expect((screen.getByPlaceholderText('ppr.adminRemarks') as HTMLTextAreaElement).value).toBe('');

      fireEvent.click(screen.getByText('ppr.approve'));
      expect(defaultProps.reviewPprRequest).toHaveBeenCalledWith('req-1', 'approved', undefined);
    });

    it('tells when the request no longer exists, without the key from the link', () => {
      const { container } = openList('gone-key');

      const notice = screen.getByText('ppr.linkedRequestMissing');
      expect(notice).toBe(container.firstElementChild!.firstElementChild);
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
      expect(scrollIntoView.mock.instances[0]).toBe(notice);
      expect(container.querySelector('[aria-expanded="true"]')).toBeNull();
      expect(container.innerHTML).not.toContain('gone-key');
    });

    it('tells in its details when the request has already been answered', () => {
      const { container } = openList('req-2');

      expect(isOpen('HB-XYZ')).toBe(true);
      const row = rowOf(container, 'req-2');
      expect(within(row).getByText('ppr.linkedRequestAnswered')).toBeTruthy();
      expect(scrollIntoView.mock.instances[0]).toBe(row);
      expect(screen.queryByText('ppr.linkedRequestMissing')).toBeNull();
    });

    it('does not call the request already answered after the admin answers it', () => {
      const { update } = openList('req-1');
      fireEvent.click(screen.getByText('ppr.approve'));
      expect(defaultProps.reviewPprRequest).toHaveBeenCalledWith('req-1', 'approved', undefined);

      // The list is reloaded after the review
      const answered = requests.map(req => (req.key === 'req-1' ? { ...req, status: 'approved' } : req));
      update({ ...ready, loading: true });
      update({ ...ready, data: answered });
      expect(isOpen('HB-ABC')).toBe(false);

      fireEvent.click(screen.getByText('HB-ABC'));
      expect(screen.getByText('ppr.revoke')).toBeTruthy();
      expect(screen.queryByText('ppr.linkedRequestAnswered')).toBeNull();
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it('opens nothing without a link', () => {
      const { container } = openList(undefined);

      expect(container.querySelector('[aria-expanded="true"]')).toBeNull();
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(screen.queryByText('ppr.linkedRequestMissing')).toBeNull();
    });

    describe('after a failed load', () => {
      const newRequest = { ...pendingRequest, key: 'req-new', immatriculation: 'HB-NEW' };

      it('does not look for the request in those of an earlier visit, but in those of the next load', () => {
        // The list of an earlier visit, without the request of the link
        const { container, update } = renderList('req-new', ready);
        update({ ...ready, loading: true });
        update({ ...ready, loadFailed: true });

        expect(screen.getByRole('alert')).toHaveTextContent('ppr.loadFailed');
        expect(screen.queryByText('ppr.linkedRequestMissing')).toBeNull();
        expect(container.querySelector('[aria-expanded="true"]')).toBeNull();
        expect(scrollIntoView).not.toHaveBeenCalled();

        // e.g. the reload after answering another request
        update({ ...ready, loading: true });
        update({ ...ready, data: [newRequest, ...requests] });
        expect(screen.queryByRole('alert')).toBeNull();
        expect(isOpen('HB-NEW')).toBe(true);
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(scrollIntoView.mock.instances[0]).toBe(rowOf(container, 'req-new'));
        expect(screen.queryByText('ppr.linkedRequestMissing')).toBeNull();
      });

      it('tells that the requests could not be loaded, not that the request is missing', () => {
        const { update } = renderList('req-1', opened);
        update({ ...opened, loading: true });
        update({ ...opened, settingsReady: true, loadFailed: true });

        expect(screen.getByRole('alert')).toHaveTextContent('ppr.loadFailed');
        expect(screen.queryByText('ppr.linkedRequestMissing')).toBeNull();
        expect(screen.queryByText('ppr.noRequests')).toBeNull();
        expect(scrollIntoView).not.toHaveBeenCalled();
      });
    });

    describe('focus', () => {
      afterEach(() => {
        (document.activeElement as HTMLElement | null)?.blur();
      });

      it('goes to the opened request, to go on with the keyboard', () => {
        openList('req-1');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: /HB-ABC/ }));
      });

      it('goes to the notice that the request no longer exists', () => {
        openList('gone-key');
        expect(document.activeElement).toBe(screen.getByText('ppr.linkedRequestMissing'));
      });

      it('goes to a request already answered, which is described as such', () => {
        openList('req-2');
        const toggle = screen.getByRole('button', { name: /HB-XYZ/ });
        expect(document.activeElement).toBe(toggle);
        expect(toggle).toHaveAccessibleDescription('ppr.linkedRequestAnswered');
      });

      it('describes no other request as already answered', () => {
        openList('req-1');
        expect(screen.getByRole('button', { name: /HB-ABC/ })).not.toHaveAttribute('aria-describedby');
        fireEvent.click(screen.getByRole('button', { name: /HB-XYZ/ }));
        expect(screen.getByRole('button', { name: /HB-XYZ/ })).not.toHaveAttribute('aria-describedby');
      });

      it('stays where it was moved while the list loaded', () => {
        const elsewhere = document.createElement('button');
        document.body.appendChild(elsewhere);
        try {
          elsewhere.focus();
          openList('req-1');
          expect(isOpen('HB-ABC')).toBe(true);
          expect(document.activeElement).toBe(elsewhere);
        } finally {
          elsewhere.remove();
        }
      });
    });
  });
});
