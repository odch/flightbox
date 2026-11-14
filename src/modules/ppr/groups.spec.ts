import { groupPprRequests, isOpenPprRequest } from './groups';

const TODAY = '2026-11-14';

const request = (key: string, status: string, plannedDate: string, plannedTime = '10:00') =>
  ({ key, status, plannedDate, plannedTime });

describe('modules', () => {
  describe('ppr', () => {
    describe('groups', () => {
      it('puts pending requests for today or later into open, answered ones into upcoming', () => {
        const groups = groupPprRequests([
          request('a', 'pending', TODAY),
          request('b', 'approved', TODAY),
          request('c', 'rejected', '2026-11-20'),
          request('d', 'revoked', '2026-11-21'),
          request('e', 'pending', '2026-12-01'),
        ], TODAY);

        expect(groups.open.map(r => r.key)).toEqual(['a', 'e']);
        expect(groups.upcoming.map(r => r.key)).toEqual(['b', 'c', 'd']);
        expect(groups.past).toEqual([]);
      });

      it('puts requests planned before today into past, also pending ones', () => {
        const groups = groupPprRequests([
          request('a', 'pending', '2026-11-13'),
          request('b', 'approved', '2026-11-01'),
        ], TODAY);

        expect(groups.open).toEqual([]);
        expect(groups.past.map(r => r.key)).toEqual(['a', 'b']);
      });

      it('sorts open and upcoming requests the next first, past ones the most recent first', () => {
        const groups = groupPprRequests([
          request('late', 'pending', '2026-11-20', '15:00'),
          request('early', 'pending', '2026-11-20', '09:00'),
          request('tomorrow', 'pending', '2026-11-15', '18:00'),
          request('later', 'approved', '2026-11-30'),
          request('sooner', 'approved', '2026-11-16'),
          request('long-ago', 'approved', '2026-10-01'),
          request('yesterday-morning', 'rejected', '2026-11-13', '08:00'),
          request('yesterday-evening', 'approved', '2026-11-13', '19:30'),
        ], TODAY);

        expect(groups.open.map(r => r.key)).toEqual(['tomorrow', 'early', 'late']);
        expect(groups.upcoming.map(r => r.key)).toEqual(['sooner', 'later']);
        expect(groups.past.map(r => r.key)).toEqual(['yesterday-evening', 'yesterday-morning', 'long-ago']);
      });

      it('skips empty entries', () => {
        const groups = groupPprRequests([null as any, request('a', 'pending', TODAY)], TODAY);
        expect(groups.open.map(r => r.key)).toEqual(['a']);
      });

      describe('isOpenPprRequest', () => {
        it('is a pending request planned for today or later', () => {
          expect(isOpenPprRequest(request('a', 'pending', TODAY), TODAY)).toBe(true);
          expect(isOpenPprRequest(request('a', 'pending', '2026-11-15'), TODAY)).toBe(true);
        });

        it('is not an answered or a past request', () => {
          expect(isOpenPprRequest(request('a', 'approved', TODAY), TODAY)).toBe(false);
          expect(isOpenPprRequest(request('a', 'pending', '2026-11-13'), TODAY)).toBe(false);
        });
      });
    });
  });
});
