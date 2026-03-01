jest.mock('firebase-admin', () => ({
  database: jest.fn()
}));

const {compareDescending, addWithType, path, getAssociatedMovement} = require('./utils');

describe('functions', () => {
  describe('associatedMovements/utils', () => {
    describe('compareDescending', () => {
      it('returns positive when a is before b', () => {
        const a = {dateTime: '2024-01-01T10:00:00'};
        const b = {dateTime: '2024-01-01T12:00:00'};
        expect(compareDescending(a, b)).toBeGreaterThan(0);
      });

      it('returns negative when a is after b', () => {
        const a = {dateTime: '2024-01-01T12:00:00'};
        const b = {dateTime: '2024-01-01T10:00:00'};
        expect(compareDescending(a, b)).toBeLessThan(0);
      });

      it('returns 0 when a and b are equal', () => {
        const a = {dateTime: '2024-01-01T10:00:00'};
        const b = {dateTime: '2024-01-01T10:00:00'};
        expect(compareDescending(a, b)).toBe(0);
      });
    });

    describe('addWithType', () => {
      it('adds movement with type and key to array', () => {
        const movements = [];
        const mockSnapshot = {
          val: () => ({immatriculation: 'HBKOF', date: '2024-01-01'}),
          ref: {key: 'dep123'}
        };

        addWithType(movements, 'departure')(mockSnapshot);

        expect(movements).toHaveLength(1);
        expect(movements[0].type).toBe('departure');
        expect(movements[0].key).toBe('dep123');
        expect(movements[0].immatriculation).toBe('HBKOF');
      });

      it('adds multiple movements of different types', () => {
        const movements = [];
        const depSnapshot = {
          val: () => ({date: '2024-01-01'}),
          ref: {key: 'dep1'}
        };
        const arrSnapshot = {
          val: () => ({date: '2024-01-02'}),
          ref: {key: 'arr1'}
        };

        addWithType(movements, 'departure')(depSnapshot);
        addWithType(movements, 'arrival')(arrSnapshot);

        expect(movements).toHaveLength(2);
        expect(movements[0].type).toBe('departure');
        expect(movements[1].type).toBe('arrival');
      });
    });

    describe('path', () => {
      it('returns departures path for departure type', () => {
        expect(path('departure')).toBe('/movementAssociations/departures');
      });

      it('returns arrivals path for arrival type', () => {
        expect(path('arrival')).toBe('/movementAssociations/arrivals');
      });

      it('returns arrivals path for non-departure type', () => {
        expect(path('other')).toBe('/movementAssociations/arrivals');
      });
    });

    describe('getAssociatedMovement', () => {
      // Movements are sorted descending (newest first, index 0 = most recent).
      // For a movement at index i:
      //   subsequent = movements[i-1] = newer in time
      //   preceding  = movements[i+1] = older in time
      const makeMovement = (key, type, route) => ({
        key,
        type,
        departureRoute: type === 'departure' ? route : undefined,
        arrivalRoute: type === 'arrival' ? route : undefined
      });

      describe('non-circuit departure (homeBase)', () => {
        it('returns subsequent (newer) arrival as associated return flight', () => {
          // Aircraft departed (older), then returned as arrival (newer)
          // Descending order: arrival first (index 0), departure second (index 1)
          const arr = makeMovement('a1', 'arrival', 'north'); // newer
          const dep = makeMovement('d1', 'departure', 'north'); // older
          const allMovements = [arr, dep];

          const result = getAssociatedMovement(dep, true, allMovements);
          expect(result).not.toBeNull();
          expect(result.key).toBe('a1');
          expect(result.type).toBe('arrival');
        });

        it('returns null when no subsequent arrival (plane not yet returned)', () => {
          // Departure is at index 0 (most recent), no return arrival yet
          const dep = makeMovement('d1', 'departure', 'north');
          const allMovements = [dep];

          const result = getAssociatedMovement(dep, true, allMovements);
          expect(result).toBeNull();
        });
      });

      describe('non-circuit departure (not homeBase)', () => {
        it('returns preceding (older) arrival as the inbound flight', () => {
          // Aircraft arrived from elsewhere (older), then departed (newer)
          // Descending order: departure first (index 0), arrival second (index 1)
          const dep = makeMovement('d1', 'departure', 'north'); // newer
          const arr = makeMovement('a1', 'arrival', 'south');   // older
          const allMovements = [dep, arr];

          const result = getAssociatedMovement(dep, false, allMovements);
          expect(result).not.toBeNull();
          expect(result.key).toBe('a1');
        });

        it('returns null if preceding movement is not arrival type', () => {
          const dep2 = makeMovement('d2', 'departure', 'north'); // newer
          const dep1 = makeMovement('d1', 'departure', 'north'); // older
          const allMovements = [dep2, dep1];

          const result = getAssociatedMovement(dep1, false, allMovements);
          expect(result).toBeNull();
        });
      });

      describe('non-circuit arrival (homeBase)', () => {
        it('returns preceding (older) departure as associated outbound flight', () => {
          // Aircraft departed (older), then arrived back (newer)
          // Descending order: arrival first (index 0), departure second (index 1)
          const arr = makeMovement('a1', 'arrival', 'north'); // newer
          const dep = makeMovement('d1', 'departure', 'north'); // older
          const allMovements = [arr, dep];

          const result = getAssociatedMovement(arr, true, allMovements);
          expect(result).not.toBeNull();
          expect(result.key).toBe('d1');
        });
      });

      describe('circuit movements', () => {
        it('returns subsequent (newer) arrival for circuit departure', () => {
          // Circuit: depart, fly pattern, return arrival. Arrival is newer.
          // Descending: arrival (index 0), departure (index 1)
          const arr = makeMovement('a1', 'arrival', 'circuits'); // newer
          const dep = makeMovement('d1', 'departure', 'circuits'); // older
          const allMovements = [arr, dep];

          const result = getAssociatedMovement(dep, true, allMovements);
          expect(result).not.toBeNull();
          expect(result.key).toBe('a1');
        });

        it('returns preceding (older) departure for circuit arrival', () => {
          // Descending: arrival (index 0), departure (index 1)
          const arr = makeMovement('a1', 'arrival', 'circuits'); // newer
          const dep = makeMovement('d1', 'departure', 'circuits'); // older
          const allMovements = [arr, dep];

          const result = getAssociatedMovement(arr, true, allMovements);
          expect(result).not.toBeNull();
          expect(result.key).toBe('d1');
        });

        it('filters out non-circuit movements when matching circuit movements', () => {
          // Only circuit movements participate in circuit matching
          const arr = makeMovement('a1', 'arrival', 'circuits'); // newer
          const dep = makeMovement('d1', 'departure', 'circuits'); // older
          const nonCircuitArr = makeMovement('a2', 'arrival', 'north'); // non-circuit
          const allMovements = [arr, dep, nonCircuitArr];

          // dep should match arr (both circuits), not nonCircuitArr
          const result = getAssociatedMovement(dep, true, allMovements);
          expect(result).not.toBeNull();
          expect(result.key).toBe('a1');
        });
      });
    });
  });
});
