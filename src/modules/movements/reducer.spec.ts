import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import reducer, {FORBIDDEN_MOVEMENT} from './reducer';
import {finish} from '../ui/wizard/actions';

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  associatedMovements: {
    departures: {},
    arrivals: {}
  },
  loading: false,
  loadingFailed: false,
  byKey: {},
  lastSaved: null,
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

      describe('saveMovementSuccess', () => {
        const values = {
          type: 'arrival',
          immatriculation: 'HBKOF',
          date: '2016-10-09',
          time: '16:00'
        };

        it('should keep the saved movement, stamped with its key', () => {
          const newState = reducer(
            {...INITIAL_STATE} as any,
            actions.saveMovementSuccess('arrival-key', values)
          );

          expect(newState.lastSaved).toEqual({...values, key: 'arrival-key'});
        });

        // The kiosk browser stays open indefinitely and records movements back
        // to back, so this must never accumulate: one slot, always replaced.
        it('should replace the previously saved movement rather than accumulate', () => {
          let state = reducer({...INITIAL_STATE} as any, actions.saveMovementSuccess('key-1', values));
          state = reducer(state, actions.saveMovementSuccess('key-2', values));
          state = reducer(state, actions.saveMovementSuccess('key-3', values));

          expect(state.lastSaved).toEqual({...values, key: 'key-3'});
        });
      });

      describe('clearLastSaved', () => {
        it('should drop the saved movement when the wizard is finished', () => {
          const state = {
            ...INITIAL_STATE,
            lastSaved: {key: 'arrival-key', type: 'arrival', email: 'pilot@example.com'}
          };

          const newState = reducer(state as any, finish());

          expect(newState.lastSaved).toEqual(null);
        });
      });
    });
  });
});
