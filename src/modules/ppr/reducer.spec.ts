import reducer, { getPendingPprCount } from './reducer';
import * as actions from './actions';

describe('modules', () => {
  describe('ppr', () => {
    describe('reducer', () => {
      const initialState = reducer(undefined, { type: '@@INIT' } as any);

      it('should return initial state', () => {
        expect(initialState).toEqual({
          data: [],
          scope: null,
          loading: false,
          selected: null,
          initialValues: {},
          form: { submitting: false, submitted: false, result: null, commitFailed: false, reviewFailed: false, revokeFailed: false, deleteFailed: false },
          settings: {
            adminEmail: null, retentionDays: null, answerMode: 'manual', pilotInfo: null, closures: [],
            loaded: false, loadFailed: false, saving: false, saved: false, saveFailed: false,
          },
        });
      });

      describe('settings', () => {
        const noAnswers = { answerMode: 'manual' as const, pilotInfo: null, closures: [] };

        it('stores the loaded settings', () => {
          const closures = [{ from: '2026-11-19', to: '2026-11-21', reason: 'Runway works' }];
          const state = reducer(initialState, actions.pprSettingsLoaded({
            adminEmail: 'ppr@aerodrome.ch', retentionDays: 60, answerMode: 'automatic', pilotInfo: 'Runway 05/23', closures,
          }));
          expect(state.settings).toEqual(expect.objectContaining({
            adminEmail: 'ppr@aerodrome.ch', retentionDays: 60, answerMode: 'automatic', pilotInfo: 'Runway 05/23', closures,
            loaded: true, loadFailed: false,
          }));
        });

        it('uses the defaults for answer settings an older server does not send', () => {
          const state = reducer(initialState, actions.pprSettingsLoaded({ adminEmail: null, retentionDays: null } as any));
          expect(state.settings).toEqual(expect.objectContaining(noAnswers));
        });

        it('drops old save results when loading again', () => {
          const failed = { ...initialState, settings: { ...initialState.settings, saved: true, saveFailed: true } };
          const state = reducer(failed, actions.pprSettingsLoaded({ adminEmail: null, retentionDays: null, ...noAnswers }));
          expect(state.settings).toEqual(expect.objectContaining({ saved: false, saveFailed: false }));
        });

        it('marks a failed load', () => {
          const state = reducer(initialState, actions.pprSettingsLoadFailed());
          expect(state.settings.loadFailed).toBe(true);
        });

        it('tracks saving and a successful save', () => {
          const saving = reducer(initialState, actions.savePprSettings({ adminEmail: 'ppr@aerodrome.ch' }));
          expect(saving.settings).toEqual(expect.objectContaining({ saving: true, saved: false, saveFailed: false }));

          const saved = reducer(saving, actions.savePprSettingsSuccess({ adminEmail: 'ppr@aerodrome.ch', retentionDays: null, ...noAnswers }));
          expect(saved.settings).toEqual(expect.objectContaining({ adminEmail: 'ppr@aerodrome.ch', saving: false, saved: true }));
        });

        it('keeps the old address when saving fails', () => {
          const loaded = reducer(initialState, actions.pprSettingsLoaded({ adminEmail: 'old@aerodrome.ch', retentionDays: null, ...noAnswers }));
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

      it('should remember whose requests were loaded', () => {
        expect(initialState.scope).toBeNull();
        expect(reducer(initialState, actions.pprRequestsLoaded([], 'all')).scope).toBe('all');
        expect(reducer(initialState, actions.pprRequestsLoaded([], 'own')).scope).toBe('own');
      });

      describe('getPendingPprCount', () => {
        const data = [
          { key: 'req-1', status: 'pending' },
          { key: 'req-2', status: 'approved' },
          { key: 'req-3', status: 'pending' },
          { key: 'req-4', status: 'rejected' },
        ];

        it('counts the pending requests of the admin list', () => {
          expect(getPendingPprCount(reducer(initialState, actions.pprRequestsLoaded(data, 'all')))).toBe(2);
        });

        it('is 0 when no request of the admin list is pending', () => {
          expect(getPendingPprCount(reducer(initialState, actions.pprRequestsLoaded([data[1]], 'all')))).toBe(0);
        });

        it('is null before the admin list is loaded', () => {
          expect(getPendingPprCount(initialState)).toBeNull();
        });

        it('does not count the pilot\'s own requests', () => {
          expect(getPendingPprCount(reducer(initialState, actions.pprRequestsLoaded(data, 'own')))).toBeNull();
        });
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

      it('stores the answer to the submission', () => {
        const result = { key: 'req-1', status: 'approved', reviewRemarks: 'Runway 05/23' };
        const state = reducer(initialState, actions.submitPprRequestSuccess(result));
        expect(state.form.result).toEqual(result);

        expect(reducer(state, actions.resetPprForm()).form.result).toBeNull();
      });

      it('tracks a failed and a successful revocation', () => {
        const failed = reducer(initialState, actions.revokePprApprovalFailure());
        expect(failed.form.revokeFailed).toBe(true);

        expect(reducer(failed, actions.revokePprApprovalSuccess()).form.revokeFailed).toBe(false);
        expect(reducer(failed, actions.pprRequestsLoaded([], 'all')).form.revokeFailed).toBe(false);
      });

      it('should preserve other form flags on submit success', () => {
        const stateWithFlags = {
          ...initialState,
          form: { submitting: false, submitted: false, result: null, commitFailed: false, reviewFailed: true, revokeFailed: false, deleteFailed: true },
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
          form: { submitting: false, submitted: false, result: null, commitFailed: false, reviewFailed: true, revokeFailed: false, deleteFailed: true },
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
          result: { key: 'req-1', status: 'pending' },
          commitFailed: true,
          reviewFailed: true,
          revokeFailed: true,
          deleteFailed: true,
        };
        const state = reducer(
          { ...initialState, form: dirtyForm },
          actions.resetPprForm()
        );
        expect(state.form).toEqual({
          submitting: false,
          submitted: false,
          result: null,
          commitFailed: false,
          reviewFailed: false,
          revokeFailed: false,
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
