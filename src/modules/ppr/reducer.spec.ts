import reducer, { getOpenPprCount } from './reducer';
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
          loadFailed: false,
          selected: null,
          initialValues: {},
          form: {
            submitting: false, submitted: false, result: null, commitFailed: false, rateLimited: false,
            reviewFailed: false, revokeFailed: false, deleteFailed: false,
          },
          settings: {
            adminEmail: null, retentionDays: null, answerMode: 'manual', pilotInfo: null, closures: [],
            loaded: false, loadFailed: false, saving: false, saved: false, saveFailed: false,
          },
          status: { request: null, loading: false, withdrawing: false, notice: null },
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

      describe('getOpenPprCount', () => {
        const TODAY = '2026-11-14';
        const data = [
          { key: 'req-1', status: 'pending', plannedDate: TODAY },
          { key: 'req-2', status: 'approved', plannedDate: '2026-11-20' },
          { key: 'req-3', status: 'pending', plannedDate: '2026-11-20' },
          { key: 'req-4', status: 'rejected', plannedDate: '2026-11-20' },
          { key: 'req-5', status: 'pending', plannedDate: '2026-11-13' },
        ];

        it('counts the requests of the group "Offen": pending and planned for today or later', () => {
          expect(getOpenPprCount(reducer(initialState, actions.pprRequestsLoaded(data, 'all')), TODAY)).toBe(2);
        });

        it('is 0 when no request of the admin list is open', () => {
          expect(getOpenPprCount(reducer(initialState, actions.pprRequestsLoaded([data[1], data[4]], 'all')), TODAY)).toBe(0);
        });

        it('is null before the admin list is loaded', () => {
          expect(getOpenPprCount(initialState, TODAY)).toBeNull();
        });

        it('does not count the pilot\'s own requests', () => {
          expect(getOpenPprCount(reducer(initialState, actions.pprRequestsLoaded(data, 'own')), TODAY)).toBeNull();
        });

        it('counts from the aerodrome\'s date of today by default', () => {
          const future = [{ key: 'req-1', status: 'pending', plannedDate: '2999-01-01' }];
          expect(getOpenPprCount(reducer(initialState, actions.pprRequestsLoaded(future, 'all')))).toBe(1);
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

      it('marks a failed load, keeping the requests and whose they are', () => {
        const loaded = reducer(initialState, actions.pprRequestsLoaded([{ key: 'req-1' }], 'all'));
        const state = reducer(reducer(loaded, actions.setPprLoading()), actions.pprLoadFailed());
        expect(state.loadFailed).toBe(true);
        expect(state.data).toEqual([{ key: 'req-1' }]);
        expect(state.scope).toBe('all');
      });

      it('clears a failed load when loading again, and when requests are loaded', () => {
        const failed = reducer(initialState, actions.pprLoadFailed());
        expect(reducer(failed, actions.setPprLoading()).loadFailed).toBe(false);
        // e.g. two loads at once, the one that failed finishing first
        expect(reducer(failed, actions.pprRequestsLoaded([], 'all')).loadFailed).toBe(false);
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
          form: {
            submitting: false, submitted: false, result: null, commitFailed: false, rateLimited: false,
            reviewFailed: true, revokeFailed: false, deleteFailed: true,
          },
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
          form: {
            submitting: false, submitted: false, result: null, commitFailed: false, rateLimited: false,
            reviewFailed: true, revokeFailed: false, deleteFailed: true,
          },
        };
        const state = reducer(stateWithFlags, actions.submitPprRequestFailure());
        expect(state.form.reviewFailed).toBe(true);
        expect(state.form.deleteFailed).toBe(true);
      });

      describe('requests without login', () => {
        it('tracks sending like requests with login', () => {
          const failed = reducer(initialState, actions.submitPprRequestFailure());
          const state = reducer(failed, actions.submitPprGuestRequest({ email: 'pilot@example.com' }));
          expect(state.form.submitting).toBe(true);
          expect(state.form.commitFailed).toBe(false);
        });

        it('remembers a refusal for too many requests until the next submit or a reset', () => {
          const refused = reducer(initialState, actions.submitPprRequestFailure(true));
          expect(refused.form).toEqual(expect.objectContaining({ commitFailed: true, rateLimited: true }));

          expect(reducer(refused, actions.submitPprGuestRequest({})).form.rateLimited).toBe(false);
          expect(reducer(refused, actions.resetPprForm()).form.rateLimited).toBe(false);
        });

        it('tells other failures apart from a refusal for too many requests', () => {
          const refused = reducer(initialState, actions.submitPprRequestFailure(true));
          expect(reducer(refused, actions.submitPprRequestFailure()).form.rateLimited).toBe(false);
        });

        it('stores the token of the status link with the answer', () => {
          const result = { key: 'req-1', status: 'pending', statusToken: 'token-1' };
          expect(reducer(initialState, actions.submitPprRequestSuccess(result)).form.result).toEqual(result);
        });
      });

      describe('the request of a status link', () => {
        const request = {
          status: 'pending', immatriculation: 'HBKOF', plannedDate: '2026-11-20', plannedTime: '10:30',
          flightType: 'private', automatic: false, canWithdraw: true,
        };
        const loaded = reducer(reducer(initialState, actions.loadPprStatus('req-1', 'token-1')), actions.pprStatusLoaded(request));

        it('is loaded', () => {
          const loading = reducer(initialState, actions.loadPprStatus('req-1', 'token-1'));
          expect(loading.status).toEqual({ request: null, loading: true, withdrawing: false, notice: null });

          expect(loaded.status).toEqual({ request, loading: false, withdrawing: false, notice: null });
        });

        it('tells when the link leads to no request', () => {
          const state = reducer(loaded, actions.pprStatusLoadFailed('notFound'));
          expect(state.status).toEqual({ request: null, loading: false, withdrawing: false, notice: 'notFound' });
        });

        it('tells when the load failed', () => {
          const state = reducer(loaded, actions.pprStatusLoadFailed('failed'));
          expect(state.status).toEqual({ request: null, loading: false, withdrawing: false, notice: 'loadFailed' });
        });

        it('is no longer shown once withdrawn', () => {
          const withdrawing = reducer(loaded, actions.withdrawPprRequest('req-1', 'token-1'));
          expect(withdrawing.status).toEqual({ request, loading: false, withdrawing: true, notice: null });

          const state = reducer(withdrawing, actions.withdrawPprRequestSuccess());
          expect(state.status).toEqual({ request: null, loading: false, withdrawing: false, notice: 'withdrawn' });
        });

        it('keeps telling it was answered in the meantime while it is loaded again', () => {
          const withdrawing = reducer(loaded, actions.withdrawPprRequest('req-1', 'token-1'));
          const refused = reducer(withdrawing, actions.withdrawPprRequestFailure('notPending'));
          expect(refused.status).toEqual({ request, loading: false, withdrawing: false, notice: 'answeredMeanwhile' });

          const reloading = reducer(refused, actions.loadPprStatus('req-1', 'token-1'));
          expect(reloading.status).toEqual({ request: null, loading: true, withdrawing: false, notice: 'answeredMeanwhile' });

          const answered = { ...request, status: 'approved', canWithdraw: false };
          expect(reducer(reloading, actions.pprStatusLoaded(answered)).status)
            .toEqual({ request: answered, loading: false, withdrawing: false, notice: 'answeredMeanwhile' });
        });

        it('is no longer shown when it no longer exists', () => {
          const state = reducer(loaded, actions.withdrawPprRequestFailure('notFound'));
          expect(state.status).toEqual({ request: null, loading: false, withdrawing: false, notice: 'notFound' });
        });

        it('stays shown when the withdrawal failed', () => {
          const state = reducer(loaded, actions.withdrawPprRequestFailure('failed'));
          expect(state.status).toEqual({ request, loading: false, withdrawing: false, notice: 'withdrawFailed' });
        });

        it('is forgotten on a reset', () => {
          const state = reducer(reducer(loaded, actions.withdrawPprRequestSuccess()), actions.resetPprStatus());
          expect(state.status).toEqual(initialState.status);
        });

        it('leaves the lists alone', () => {
          const lists = reducer(initialState, actions.pprRequestsLoaded([{ key: 'req-2' }], 'all'));
          const state = reducer(reducer(lists, actions.loadPprStatus('req-1', 'token-1')), actions.pprStatusLoaded(request));
          expect(state.data).toEqual([{ key: 'req-2' }]);
          expect(state.scope).toBe('all');
          expect(state.loading).toBe(false);
        });
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
          rateLimited: true,
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
          rateLimited: false,
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
