import {selectFrequentAerodromes} from './index';

jest.mock('../movements/remote');
jest.mock('firebase/database', () => ({
  onChildAdded: jest.fn(() => jest.fn()),
  onChildChanged: jest.fn(() => jest.fn()),
  onChildRemoved: jest.fn(() => jest.fn()),
}));

const mv = (location: string, createdBy: string) => ({location, createdBy});

const state = (overrides: any = {}) => ({
  auth: {data: {email: 'pilot@example.com', guest: false, kiosk: false, admin: false}},
  movements: {data: {array: [
    mv('LSGG', 'pilot@example.com'),
    mv('LSGG', 'pilot@example.com'),
    mv('LSZR', 'pilot@example.com'),
  ]}},
  frequentAerodromes: {data: [], loaded: false, session: []},
  ...overrides,
});

describe('modules', () => {
  describe('frequentAerodromes', () => {
    describe('selectFrequentAerodromes', () => {
      beforeEach(() => {
        (global as any).__CONF__ = {aerodrome: {ICAO: 'LSZO'}, profileEnabled: true};
      });

      afterEach(() => {
        delete (global as any).__CONF__;
      });

      it('derives from the pilot\'s own loaded movements (regular user)', () => {
        expect(selectFrequentAerodromes(state())).toEqual(['LSGG', 'LSZR']);
      });

      it('uses the fetched slice for admins, not the club-wide movement list', () => {
        const s = state({
          auth: {data: {email: 'admin@example.com', admin: true, guest: false, kiosk: false}},
          movements: {data: {array: [mv('LFSB', 'someone-else@example.com')]}},
          frequentAerodromes: {data: ['LSZR'], loaded: true, session: []},
        });
        expect(selectFrequentAerodromes(s)).toEqual(['LSZR']);
      });

      it('surfaces a just-used aerodrome first, even before the list reloads', () => {
        const s = state({frequentAerodromes: {data: [], loaded: false, session: ['LFSB']}});
        expect(selectFrequentAerodromes(s)).toEqual(['LFSB', 'LSGG', 'LSZR']);
      });

      it('does not duplicate a session aerodrome that is also in the base list', () => {
        const s = state({frequentAerodromes: {data: [], loaded: false, session: ['LSGG']}});
        expect(selectFrequentAerodromes(s)).toEqual(['LSGG', 'LSZR']);
      });

      it('never includes the home aerodrome', () => {
        const s = state({frequentAerodromes: {data: [], loaded: false, session: ['LSZO']}});
        expect(selectFrequentAerodromes(s)).toEqual(['LSGG', 'LSZR']);
      });

      it('returns [] for a guest', () => {
        const s = state({auth: {data: {email: null, guest: true, kiosk: false}}});
        expect(selectFrequentAerodromes(s)).toEqual([]);
      });
    });
  });
});
