import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import reducer, {FORBIDDEN_MOVEMENT} from './reducer';

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  associatedMovements: {
    departures: {},
    arrivals: {}
  },
  loading: false,
  loadingFailed: false,
  byKey: {},
  filter: {
    date: { // "end" is the newer date bound ("start" must come before "end")
      start: null,
      end: null
    },
    immatriculation: '',
    onlyWithoutAssociatedMovement: false
  },
  previousFilter: null
};

describe('modules', () => {
  describe('movements', () => {
    describe('reducers', () => {
      it('should handle initial state', () => {
        expect(
          reducer(undefined, {} as any)
        ).toEqual(INITIAL_STATE);
      });

      describe('setMovements', () => {
        it('should set movements', () => {
          const state = {
            loading: true,
            data: new ImmutableItemsArray([{
              key: 'arr1',
              type: 'arrival',
              immatriculation: 'HBKOF',
              date: '2017-04-28',
              time: '15:00'
            }, {
              key: 'dep1',
              type: 'departure',
              immatriculation: 'HBKOF',
              date: '2017-04-28',
              time: '14:00'
            }])
          };

          const newMovements = new ImmutableItemsArray([{
            key: 'arr2',
            type: 'arrival',
            immatriculation: 'HBKFW',
            date: '2017-04-29',
            time: '15:00'
          }, {
            key: 'dep1',
            type: 'departure',
            immatriculation: 'HBKFW',
            date: '2017-04-29',
            time: '14:00'
          }, {
            key: 'arr1',
            type: 'arrival',
            immatriculation: 'HBKOF',
            date: '2017-04-28',
            time: '15:00'
          }, {
            key: 'dep1',
            type: 'departure',
            immatriculation: 'HBKOF',
            date: '2017-04-28',
            time: '14:00'
          }]);

          const action = actions.setMovements(newMovements);

          const newState = reducer(state as any, action);

          expect(newState.loading).toEqual(false);
          expect(newState.data).toEqual(newMovements);
        });
      });

      describe('movementByKeyUnavailable', () => {
        it('should set the by-key entry to null so the view stops loading', () => {
          const state = { byKey: { existing: { key: 'existing' } } };

          const newState = reducer(state as any, actions.movementByKeyUnavailable('foreign-key'));

          expect(newState.byKey['foreign-key']).toBeNull();
          expect(newState.byKey['existing']).toEqual({ key: 'existing' });
        });
      });

      describe('movementByKeyForbidden', () => {
        it('should set the by-key entry to the forbidden sentinel', () => {
          const state = { byKey: {} };

          const newState = reducer(state as any, actions.movementByKeyForbidden('foreign-key'));

          expect(newState.byKey['foreign-key']).toBe(FORBIDDEN_MOVEMENT);
        });
      });

      describe('setLoading', () => {
        it('should set loading to true and loadingFailed to false', () => {
          const state = {
            loading: false,
            loadingFailed: true,
          };

          const newState = reducer(state as any, actions.setMovementsLoading());

          expect(newState.loading).toEqual(true);
          expect(newState.loadingFailed).toEqual(false);
        });
      });

      describe('setLoadingFailure', () => {
        it('should set loadingFailed to true and loading to false', () => {
          const state = {
            loading: true,
            loadingFailed: false,
          };

          const newState = reducer(state as any, actions.loadMovementsFailure());

          expect(newState.loadingFailed).toEqual(true);
          expect(newState.loading).toEqual(false);
        });
      });
    });
  });
});
