// The groups the PPR lists show the requests in:
// - open: pending and planned for today or later, the ones to answer
// - upcoming: answered and planned for today or later
// - past: planned before today, whatever their status
// `today` is the aerodrome's date ('YYYY-MM-DD', dates.localDate()).

interface GroupableRequest {
  status: string;
  plannedDate?: string;
  plannedTime?: string;
}

export interface PprRequestGroups<T> {
  open: T[];
  upcoming: T[];
  past: T[];
}

const plannedAt = (request: GroupableRequest) => `${request.plannedDate || ''} ${request.plannedTime || ''}`;

const isUpcoming = (request: GroupableRequest, today: string) => (request.plannedDate || '') >= today;

export function isOpenPprRequest(request: GroupableRequest, today: string): boolean {
  return request.status === 'pending' && isUpcoming(request, today);
}

// Open and upcoming requests by planned date and time, the next first; past
// requests the most recent first
export function groupPprRequests<T extends GroupableRequest>(requests: T[], today: string): PprRequestGroups<T> {
  const groups: PprRequestGroups<T> = { open: [], upcoming: [], past: [] };
  requests.forEach(request => {
    if (!request) {
      return;
    }
    if (!isUpcoming(request, today)) {
      groups.past.push(request);
    } else if (request.status === 'pending') {
      groups.open.push(request);
    } else {
      groups.upcoming.push(request);
    }
  });
  const byPlannedAt = (a: T, b: T) => {
    const [x, y] = [plannedAt(a), plannedAt(b)];
    return x < y ? -1 : x > y ? 1 : 0;
  };
  groups.open.sort(byPlannedAt);
  groups.upcoming.sort(byPlannedAt);
  groups.past.sort((a, b) => byPlannedAt(b, a));
  return groups;
}
