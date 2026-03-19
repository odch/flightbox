import reducer from './reducer';
import * as actions from './actions';

describe('modules', () => {
  describe('ppr', () => {
    describe('reducer', () => {
      const initialState = reducer(undefined, { type: '@@INIT' } as any);

      it('should return initial state', () => {
        expect(initialState).toEqual({
          data: [],
          loading: false,
          selected: null,
          initialValues: {},
          form: { submitted: false, commitFailed: false, reviewFailed: false, deleteFailed: false },
        });
      });

      it('should set initialValues on form initialized', () => {
        const values = { firstname: 'Max', lastname: 'Muster' };
        const state = reducer(initialState, actions.pprFormInitialized(values));
        expect(state.initialValues).toEqual(values);
      });

      it('should set loading', () => {
        const state = reducer(initialState, actions.setPprLoading());
        expect(state.loading).toBe(true);
      });

      it('should set data on loaded', () => {
        const data = [{ key: 'req-1' }, { key: 'req-2' }];
        const state = reducer(
          { ...initialState, loading: true },
          actions.pprRequestsLoaded(data)
        );
        expect(state.data).toEqual(data);
        expect(state.loading).toBe(false);
      });

      it('should stop loading on load failure without clearing data', () => {
        const stateWithData = {
          ...initialState,
          data: [{ key: 'req-1' }],
          loading: true,
        };
        const state = reducer(stateWithData, actions.pprLoadFailed());
        expect(state.loading).toBe(false);
        expect(state.data).toEqual([{ key: 'req-1' }]);
      });

      it('should set form submitted on submit success', () => {
        const state = reducer(initialState, actions.submitPprRequestSuccess());
        expect(state.form.submitted).toBe(true);
        expect(state.form.commitFailed).toBe(false);
      });

      it('should preserve other form flags on submit success', () => {
        const stateWithFlags = {
          ...initialState,
          form: { submitted: false, commitFailed: false, reviewFailed: true, deleteFailed: true },
        };
        const state = reducer(stateWithFlags, actions.submitPprRequestSuccess());
        expect(state.form.reviewFailed).toBe(true);
        expect(state.form.deleteFailed).toBe(true);
      });

      it('should set form commitFailed on submit failure', () => {
        const state = reducer(initialState, actions.submitPprRequestFailure());
        expect(state.form.submitted).toBe(false);
        expect(state.form.commitFailed).toBe(true);
      });

      it('should preserve other form flags on submit failure', () => {
        const stateWithFlags = {
          ...initialState,
          form: { submitted: false, commitFailed: false, reviewFailed: true, deleteFailed: true },
        };
        const state = reducer(stateWithFlags, actions.submitPprRequestFailure());
        expect(state.form.reviewFailed).toBe(true);
        expect(state.form.deleteFailed).toBe(true);
      });

      it('should clear reviewFailed on review success', () => {
        const stateWithError = {
          ...initialState,
          form: { ...initialState.form, reviewFailed: true },
        };
        const state = reducer(stateWithError, actions.reviewPprRequestSuccess());
        expect(state.form.reviewFailed).toBe(false);
      });

      it('should set reviewFailed on review failure', () => {
        const state = reducer(initialState, actions.reviewPprRequestFailure());
        expect(state.form.reviewFailed).toBe(true);
      });

      it('should remove deleted request from data', () => {
        const stateWithData = {
          ...initialState,
          data: [{ key: 'req-1' }, { key: 'req-2' }],
          selected: 'req-1',
        };
        const state = reducer(stateWithData, actions.deletePprRequestSuccess('req-1'));
        expect(state.data).toEqual([{ key: 'req-2' }]);
        expect(state.selected).toBeNull();
      });

      it('should keep selected if different key deleted', () => {
        const stateWithData = {
          ...initialState,
          data: [{ key: 'req-1' }, { key: 'req-2' }],
          selected: 'req-1',
        };
        const state = reducer(stateWithData, actions.deletePprRequestSuccess('req-2'));
        expect(state.selected).toBe('req-1');
      });

      it('should set deleteFailed on delete failure', () => {
        const state = reducer(initialState, actions.deletePprRequestFailure());
        expect(state.form.deleteFailed).toBe(true);
      });

      it('should set selected', () => {
        const state = reducer(initialState, actions.selectPprRequest('req-1'));
        expect(state.selected).toBe('req-1');
      });

      it('should clear selected', () => {
        const state = reducer(
          { ...initialState, selected: 'req-1' },
          actions.selectPprRequest(null)
        );
        expect(state.selected).toBeNull();
      });

      it('should reset form', () => {
        const dirtyForm = {
          submitted: true,
          commitFailed: true,
          reviewFailed: true,
          deleteFailed: true,
        };
        const state = reducer(
          { ...initialState, form: dirtyForm },
          actions.resetPprForm()
        );
        expect(state.form).toEqual({
          submitted: false,
          commitFailed: false,
          reviewFailed: false,
          deleteFailed: false,
        });
      });

      it('should return state for unknown action', () => {
        const state = reducer(initialState, { type: 'UNKNOWN' } as any);
        expect(state).toEqual(initialState);
      });
    });
  });
});
