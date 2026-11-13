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
          form: { submitting: false, submitted: false, commitFailed: false, reviewFailed: false, deleteFailed: false },
          settings: { adminEmail: null, retentionDays: null, loaded: false, loadFailed: false, saving: false, saved: false, saveFailed: false },
        });
      });

      describe('settings', () => {
        it('stores the loaded settings', () => {
          const state = reducer(initialState, actions.pprSettingsLoaded({ adminEmail: 'ppr@aerodrome.ch', retentionDays: 60 }));
          expect(state.settings).toEqual(expect.objectContaining({ adminEmail: 'ppr@aerodrome.ch', retentionDays: 60, loaded: true, loadFailed: false }));
        });

        it('drops old save results when loading again', () => {
          const failed = { ...initialState, settings: { ...initialState.settings, saved: true, saveFailed: true } };
          const state = reducer(failed, actions.pprSettingsLoaded({ adminEmail: null, retentionDays: null }));
          expect(state.settings).toEqual(expect.objectContaining({ saved: false, saveFailed: false }));
        });

        it('marks a failed load', () => {
          const state = reducer(initialState, actions.pprSettingsLoadFailed());
          expect(state.settings.loadFailed).toBe(true);
        });

        it('tracks saving and a successful save', () => {
          const saving = reducer(initialState, actions.savePprSettings({ adminEmail: 'ppr@aerodrome.ch' }));
          expect(saving.settings).toEqual(expect.objectContaining({ saving: true, saved: false, saveFailed: false }));

          const saved = reducer(saving, actions.savePprSettingsSuccess({ adminEmail: 'ppr@aerodrome.ch', retentionDays: null }));
          expect(saved.settings).toEqual(expect.objectContaining({ adminEmail: 'ppr@aerodrome.ch', saving: false, saved: true }));
        });

        it('keeps the old address when saving fails', () => {
          const loaded = reducer(initialState, actions.pprSettingsLoaded({ adminEmail: 'old@aerodrome.ch', retentionDays: null }));
          const saving = reducer(loaded, actions.savePprSettings({ adminEmail: 'new@aerodrome.ch' }));
          const failed = reducer(saving, actions.savePprSettingsFailure());
          expect(failed.settings).toEqual(expect.objectContaining({ adminEmail: 'old@aerodrome.ch', saving: false, saveFailed: true }));
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

      it('should set submitting and clear commitFailed when a submit starts', () => {
        const failed = { ...initialState, form: { ...initialState.form, commitFailed: true } };
        const state = reducer(failed, actions.submitPprRequest({ firstname: 'Max' }));
        expect(state.form.submitting).toBe(true);
        expect(state.form.commitFailed).toBe(false);
      });

      it('should set form submitted on submit success', () => {
        const submitting = { ...initialState, form: { ...initialState.form, submitting: true } };
        const state = reducer(submitting, actions.submitPprRequestSuccess());
        expect(state.form.submitting).toBe(false);
        expect(state.form.submitted).toBe(true);
        expect(state.form.commitFailed).toBe(false);
      });

      it('should preserve other form flags on submit success', () => {
        const stateWithFlags = {
          ...initialState,
          form: { submitting: false, submitted: false, commitFailed: false, reviewFailed: true, deleteFailed: true },
        };
        const state = reducer(stateWithFlags, actions.submitPprRequestSuccess());
        expect(state.form.reviewFailed).toBe(true);
        expect(state.form.deleteFailed).toBe(true);
      });

      it('should set form commitFailed on submit failure', () => {
        const submitting = { ...initialState, form: { ...initialState.form, submitting: true } };
        const state = reducer(submitting, actions.submitPprRequestFailure());
        expect(state.form.submitting).toBe(false);
        expect(state.form.submitted).toBe(false);
        expect(state.form.commitFailed).toBe(true);
      });

      it('should preserve other form flags on submit failure', () => {
        const stateWithFlags = {
          ...initialState,
          form: { submitting: false, submitted: false, commitFailed: false, reviewFailed: true, deleteFailed: true },
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
          submitting: true,
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
          submitting: false,
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
