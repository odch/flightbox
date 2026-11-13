import { call, put } from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';
import { getIdToken } from '../../util/firebase';
import { getProfileDefaultValues } from '../movements/sagas';
import { getDefaultPlannedDateTime } from './plannedDefaults';

jest.mock('../../history', () => ({ history: { push: jest.fn() } }));
jest.mock('../../i18n', () => ({ language: 'en' }));

import { history } from '../../history';

describe('modules', () => {
  describe('ppr', () => {
    describe('sagas', () => {
      describe('initPprForm', () => {
        const planned = { plannedDate: '2026-11-13', plannedTime: '16:30' };

        it('starts with the profile values and a planned date and time', () => {
          const generator = sagas.initPprForm();

          expect(generator.next().value).toEqual(call(getDefaultPlannedDateTime));
          expect(generator.next(planned).value).toEqual(call(getProfileDefaultValues));

          const profile = { firstname: 'Max', lastname: 'Muster', immatriculation: 'HBKOF' };
          expect(generator.next(profile).value).toEqual(put(actions.pprFormInitialized({ ...profile, ...planned })));
          expect(generator.next().done).toEqual(true);
        });

        it('still sets the planned date and time when the profile cannot be loaded', () => {
          const generator = sagas.initPprForm();

          generator.next(); // getDefaultPlannedDateTime
          generator.next(planned); // getProfileDefaultValues

          expect(generator.throw(new Error('profile failed')).value)
            .toEqual(put(actions.pprFormInitialized(planned)));
          expect(generator.next().done).toEqual(true);
        });
      });

      describe('loadPprRequests', () => {
        it('should load the user\'s own requests by default', () => {
          const generator = sagas.loadPprRequests(actions.loadPprRequests());

          expect(generator.next().value).toEqual(put(actions.setPprLoading()));
          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next('token-123').value).toEqual(call(remote.loadRequests, 'token-123', 'own'));

          const data = [{ key: 'req-1' }];
          expect(generator.next(data).value).toEqual(put(actions.pprRequestsLoaded(data)));
          expect(generator.next().done).toEqual(true);
        });

        it('should load all requests for the admin list', () => {
          const generator = sagas.loadPprRequests(actions.loadPprRequests('all'));

          generator.next(); // setPprLoading
          generator.next(); // getIdToken
          expect(generator.next('token-123').value).toEqual(call(remote.loadRequests, 'token-123', 'all'));

          const data = [{ key: 'req-1' }];
          expect(generator.next(data).value).toEqual(put(actions.pprRequestsLoaded(data, 'all')));
        });

        it('should dispatch loadFailed on error without clearing data', () => {
          const generator = sagas.loadPprRequests(actions.loadPprRequests());

          generator.next(); // setPprLoading
          generator.next(); // getIdToken

          const error = new Error('network error');
          expect(generator.throw(error).value).toEqual(put(actions.pprLoadFailed()));
          expect(generator.next().done).toEqual(true);
        });
      });

      describe('submitPprRequest', () => {
        it('should submit request with the app language', () => {
          const values = { firstname: 'Max' };
          const action = actions.submitPprRequest(values);
          const generator = sagas.submitPprRequest(action);

          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next('token-123').value).toEqual(
            call(remote.submitRequest, { firstname: 'Max', language: 'en' }, 'token-123')
          );
          const result = { key: 'req-1', status: 'pending' as const };
          expect(generator.next(result).value).toEqual(put(actions.submitPprRequestSuccess(result)));
          expect(generator.next().done).toEqual(true);
        });

        it('passes on an automatic answer', () => {
          const generator = sagas.submitPprRequest(actions.submitPprRequest({}));
          generator.next(); // getIdToken
          generator.next('token-123'); // submitRequest

          const result = { key: 'req-1', status: 'approved' as const, reviewRemarks: 'Runway 05/23' };
          expect(generator.next(result).value).toEqual(put(actions.submitPprRequestSuccess(result)));
        });

        it('should put failure on error', () => {
          const action = actions.submitPprRequest({});
          const generator = sagas.submitPprRequest(action);

          generator.next(); // getIdToken

          const error = new Error('submit failed');
          expect(generator.throw(error).value).toEqual(put(actions.submitPprRequestFailure()));
          expect(generator.next().done).toEqual(true);
        });
      });

      describe('reviewPprRequest', () => {
        it('should review request and reload', () => {
          const action = actions.reviewPprRequest('req-1', 'approved', 'Good');
          const generator = sagas.reviewPprRequest(action);

          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next('token-123').value).toEqual(
            call(remote.reviewRequest, 'req-1', 'approved', 'Good', 'token-123')
          );
          expect(generator.next().value).toEqual(put(actions.reviewPprRequestSuccess()));
          // Reload happens in separate try/catch
          expect(generator.next().value).toEqual(call(sagas.loadPprRequests, actions.loadPprRequests('all')));
          expect(generator.next().done).toEqual(true);
        });

        it('should put failure on error', () => {
          const action = actions.reviewPprRequest('req-1', 'approved');
          const generator = sagas.reviewPprRequest(action);

          generator.next(); // getIdToken

          const error = new Error('review failed');
          expect(generator.throw(error).value).toEqual(put(actions.reviewPprRequestFailure()));
          expect(generator.next().done).toEqual(true);
        });

        it('should not report failure if reload fails after successful review', () => {
          const action = actions.reviewPprRequest('req-1', 'approved', 'Good');
          const generator = sagas.reviewPprRequest(action);

          generator.next(); // yields call(getIdToken)
          generator.next('token-123'); // yields call(reviewRequest)
          generator.next(); // yields put(reviewPprRequestSuccess)
          const reloadStep = generator.next(); // yields call(loadPprRequests)
          expect(reloadStep.value).toEqual(call(sagas.loadPprRequests, actions.loadPprRequests('all')));
          // Reload fails — caught by inner try/catch, not the review catch
          const afterThrow = generator.throw(new Error('reload failed'));
          expect(afterThrow.done).toEqual(true);
        });
      });

      describe('revokePprApproval', () => {
        it('revokes the approval with the reason and reloads', () => {
          const generator = sagas.revokePprApproval(actions.revokePprApproval('req-1', 'Runway works'));

          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next('token-123').value).toEqual(
            call(remote.revokeApproval, 'req-1', 'Runway works', 'token-123')
          );
          expect(generator.next().value).toEqual(put(actions.revokePprApprovalSuccess()));
          expect(generator.next().value).toEqual(call(sagas.loadPprRequests, actions.loadPprRequests('all')));
          expect(generator.next().done).toEqual(true);
        });

        it('reports a failed revocation and does not reload', () => {
          const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
          const generator = sagas.revokePprApproval(actions.revokePprApproval('req-1', 'Runway works'));
          generator.next(); // getIdToken

          expect(generator.throw(new Error('409')).value).toEqual(put(actions.revokePprApprovalFailure()));
          expect(generator.next().done).toEqual(true);
          error.mockRestore();
        });

        it('ignores a failed reload after the revocation', () => {
          const generator = sagas.revokePprApproval(actions.revokePprApproval('req-1', 'Runway works'));
          generator.next(); // getIdToken
          generator.next('token-123'); // revokeApproval
          generator.next(); // success
          generator.next(); // reload

          expect(generator.throw(new Error('reload failed')).done).toEqual(true);
        });
      });

      describe('deletePprRequest', () => {
        it('should delete request successfully', () => {
          const action = actions.deletePprRequest('req-1');
          const generator = sagas.deletePprRequest(action);

          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next('token-123').value).toEqual(
            call(remote.deleteRequest, 'req-1', 'token-123')
          );
          expect(generator.next().value).toEqual(put(actions.deletePprRequestSuccess('req-1')));
          expect(generator.next().done).toEqual(true);
        });

        it('should put failure on error', () => {
          const action = actions.deletePprRequest('req-1');
          const generator = sagas.deletePprRequest(action);

          generator.next(); // getIdToken

          const error = new Error('delete failed');
          expect(generator.throw(error).value).toEqual(put(actions.deletePprRequestFailure()));
          expect(generator.next().done).toEqual(true);
        });
      });

      describe('loadPprSettings', () => {
        it('loads the settings', () => {
          const generator = sagas.loadPprSettings();

          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next('token-123').value).toEqual(call(remote.loadSettings, 'token-123'));
          const settings = {
            adminEmail: 'ppr@aerodrome.ch', retentionDays: null, answerMode: 'manual' as const, pilotInfo: null, closures: [],
          };
          expect(generator.next(settings).value).toEqual(put(actions.pprSettingsLoaded(settings)));
          expect(generator.next().done).toEqual(true);
        });

        it('reports a failed load', () => {
          const generator = sagas.loadPprSettings();
          generator.next(); // getIdToken

          expect(generator.throw(new Error('network error')).value).toEqual(put(actions.pprSettingsLoadFailed()));
        });
      });

      describe('savePprSettings', () => {
        it('saves the given settings and stores all of them', () => {
          const changed = { retentionDays: 90 };
          const generator = sagas.savePprSettings(actions.savePprSettings(changed));

          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next('token-123').value).toEqual(call(remote.saveSettings, changed, 'token-123'));
          const all = {
            adminEmail: 'ppr@aerodrome.ch', retentionDays: 90, answerMode: 'automatic' as const, pilotInfo: null, closures: [],
          };
          expect(generator.next(all).value).toEqual(put(actions.savePprSettingsSuccess(all)));
          expect(generator.next().done).toEqual(true);
        });

        it('reports a failed save', () => {
          const generator = sagas.savePprSettings(actions.savePprSettings({ adminEmail: 'x@y.ch' }));
          generator.next(); // getIdToken

          expect(generator.throw(new Error('400')).value).toEqual(put(actions.savePprSettingsFailure()));
        });
      });

      describe('confirmPprSubmitSuccess', () => {
        it('should redirect to root and reset form', () => {
          (history.push as jest.Mock).mockClear();

          const generator = sagas.confirmPprSubmitSuccess();

          expect(generator.next().value).toEqual(put(actions.resetPprForm()));
          expect(generator.next().done).toEqual(true);

          expect(history.push).toHaveBeenCalledWith('/');
        });
      });
    });
  });
});
