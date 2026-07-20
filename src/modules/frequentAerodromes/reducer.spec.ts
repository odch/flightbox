import reducer from './reducer';
import * as actions from './actions';
import { saveMovementSuccess } from '../movements/actions';

describe('modules', () => {
  describe('frequentAerodromes', () => {
    describe('reducer', () => {
      it('has an empty, unloaded initial state', () => {
        const state = reducer(undefined, {type: '@@INIT'} as any);
        expect(state).toEqual({data: [], loaded: false, session: []});
      });

      it('stores the loaded data and marks loaded', () => {
        const state = reducer(undefined, actions.frequentAerodromesLoaded(['LSGG', 'LSZR']));
        expect(state).toEqual({data: ['LSGG', 'LSZR'], loaded: true, session: []});
      });

      it('stays loaded when set to an empty list', () => {
        const state = reducer({data: ['LSGG'], loaded: true, session: []}, actions.frequentAerodromesLoaded([]));
        expect(state).toEqual({data: [], loaded: true, session: []});
      });

      it('records a saved movement\'s location (uppercased) most-recent-first', () => {
        const state = reducer(undefined, saveMovementSuccess('k1', {location: 'lsgg'}));
        expect(state.session).toEqual(['LSGG']);
      });

      it('moves a re-used location back to the front without duplicating', () => {
        let state = reducer(undefined, saveMovementSuccess('k1', {location: 'LSGG'}));
        state = reducer(state, saveMovementSuccess('k2', {location: 'LSZR'}));
        state = reducer(state, saveMovementSuccess('k3', {location: 'LSGG'}));
        expect(state.session).toEqual(['LSGG', 'LSZR']);
      });

      it('ignores a save with no location', () => {
        const state = reducer(undefined, saveMovementSuccess('k1', {}));
        expect(state.session).toEqual([]);
      });
    });
  });
});
