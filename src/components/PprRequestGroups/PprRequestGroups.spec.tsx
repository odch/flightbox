import React from 'react';
import { renderWithTheme, screen, fireEvent, within } from '../../../test/renderWithTheme';
import dates from '../../util/dates';
import PprRequestGroups, { PAST_SHOWN } from './PprRequestGroups';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      options && options.count !== undefined ? `${key} (${options.count})` : key,
  }),
}));

const TODAY = '2026-11-14';

const request = (key: string, status: string, plannedDate: string, plannedTime = '10:00') =>
  ({ key, status, plannedDate, plannedTime });

const renderGroups = (requests: any[], props: any = {}) => renderWithTheme(
  <PprRequestGroups
    requests={requests}
    renderRequest={(req: any) => <div data-testid="request">{req.key}</div>}
    {...props}
  />
);

// The groups carry data-cy, which renderWithTheme's queries don't read
const groupEl = (container: HTMLElement, name: string) =>
  container.querySelector(`[data-cy="ppr-group-${name}"]`) as HTMLElement;

const keysOf = (container: HTMLElement, name: string) =>
  within(groupEl(container, name)).queryAllByTestId('request').map(el => el.textContent);

describe('PprRequestGroups', () => {
  beforeEach(() => {
    jest.spyOn(dates, 'localDate').mockReturnValue(TODAY);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the open, upcoming and past requests under their titles, with their counts', () => {
    const { container } = renderGroups([
      request('past', 'approved', '2026-11-13'),
      request('upcoming', 'approved', '2026-11-20'),
      request('open-later', 'pending', '2026-11-21'),
      request('open-today', 'pending', TODAY),
    ]);

    const headings = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(headings).toEqual(['ppr.groups.open 2', 'ppr.groups.upcoming 1', 'ppr.groups.past 1']);
    expect(keysOf(container, 'open')).toEqual(['open-today', 'open-later']);
    expect(keysOf(container, 'upcoming')).toEqual(['upcoming']);
    expect(keysOf(container, 'past')).toEqual(['past']);
  });

  it('leaves out groups without requests', () => {
    const { container } = renderGroups([request('upcoming', 'rejected', '2026-11-20')]);

    expect(screen.getAllByRole('heading').map(h => h.textContent)).toEqual(['ppr.groups.upcoming 1']);
    expect(groupEl(container, 'open')).toBeNull();
    expect(groupEl(container, 'past')).toBeNull();
  });

  it('takes the heading level of the page', () => {
    renderGroups([request('a', 'pending', TODAY)], { headingLevel: 'h2' });
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('ppr.groups.open');
  });

  describe('past requests', () => {
    const past = Array.from({ length: PAST_SHOWN + 3 }, (_, i) =>
      request(`p${i}`, 'approved', `2026-10-${String(30 - i).padStart(2, '0')}`));

    it('shows the most recent ones, and the older ones on request', () => {
      const { container } = renderGroups([...past].reverse());

      expect(keysOf(container, 'past')).toEqual(past.slice(0, PAST_SHOWN).map(r => r.key));
      expect(screen.getByRole('heading')).toHaveTextContent(`ppr.groups.past ${PAST_SHOWN + 3}`);

      fireEvent.click(screen.getByText('ppr.groups.showOlder (3)'));

      expect(keysOf(container, 'past')).toEqual(past.map(r => r.key));
      expect(screen.queryByText(/ppr.groups.showOlder/)).toBeNull();
    });

    it('shows all of them when there are no more than the most recent ones', () => {
      const { container } = renderGroups(past.slice(0, PAST_SHOWN));

      expect(keysOf(container, 'past')).toHaveLength(PAST_SHOWN);
      expect(screen.queryByText(/ppr.groups.showOlder/)).toBeNull();
    });

    it('shows an older one asked for (the request of a link), with all others', () => {
      const { container } = renderGroups(past, { revealKey: `p${PAST_SHOWN + 2}` });

      expect(keysOf(container, 'past')).toEqual(past.map(r => r.key));
      expect(screen.queryByText(/ppr.groups.showOlder/)).toBeNull();
    });
  });
});
