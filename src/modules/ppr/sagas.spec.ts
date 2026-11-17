import { call, put, race, take, takeEvery, takeLatest, takeLeading } from 'redux-saga/effects';
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
        it('sends the request until the form is left', () => {
          const values = { firstname: 'Max' };
          const action = actions.submitPprRequest(values);
          const generator = sagas.submitPprRequest(action);

          expect(generator.next().value).toEqual(race({
            result: call(sagas.sendPprRequest, values),
            reset: take(actions.RESET_PPR_FORM),
          }));
          const result = { key: 'req-1', status: 'pending' as const };
          expect(generator.next({ result }).value).toEqual(put(actions.submitPprRequestSuccess(result)));
          expect(generator.next().done).toEqual(true);
        });

        it('sends the request with the ID token and the app language', () => {
          const generator = sagas.sendPprRequest({ firstname: 'Max' });

          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next('token-123').value).toEqual(
            call(remote.submitRequest, { firstname: 'Max', language: 'en' }, 'token-123')
          );
          const result = { key: 'req-1', status: 'pending' };
          expect(generator.next(result)).toEqual({ value: result, done: true });
        });

        it('passes on an automatic answer', () => {
          const generator = sagas.submitPprRequest(actions.submitPprRequest({}));
          generator.next(); // sendPprRequest

          const result = { key: 'req-1', status: 'approved' as const, reviewRemarks: 'Runway 05/23' };
          expect(generator.next({ result }).value).toEqual(put(actions.submitPprRequestSuccess(result)));
        });

        it('drops the answer when the form was left before it came', () => {
          const generator = sagas.submitPprRequest(actions.submitPprRequest({}));
          generator.next(); // sendPprRequest

          expect(generator.next({ reset: actions.resetPprForm() }).done).toEqual(true);
        });

        it('should put failure on error', () => {
          const action = actions.submitPprRequest({});
          const generator = sagas.submitPprRequest(action);

          generator.next(); // sendPprRequest

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
            manualAnswers: { helicopters: false, mtowFrom: null },
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
            manualAnswers: { helicopters: false, mtowFrom: null },
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

      // Refusals of the routes without login, as remote throws them
      const refusal = (status: number) => Object.assign(new Error(`Request failed: ${status}`), { status });

      describe('without login', () => {
        let consoleError: jest.SpyInstance;

        beforeEach(() => {
          consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        });

        afterEach(() => {
          consoleError.mockRestore();
        });

        describe('submitPprGuestRequest', () => {
          it('sends the request until the form is left', () => {
            const values = { firstname: 'Max', email: 'max@example.com' };
            const generator = sagas.submitPprGuestRequest(actions.submitPprGuestRequest(values));

            expect(generator.next().value).toEqual(race({
              result: call(sagas.sendPprGuestRequest, values),
              reset: take(actions.RESET_PPR_FORM),
            }));
            const result = { key: 'req-1', status: 'pending', statusToken: 'token-1', emailSent: true };
            expect(generator.next({ result }).value).toEqual(
              put(actions.submitPprRequestSuccess({ ...result, email: 'max@example.com' }))
            );
            expect(generator.next().done).toEqual(true);
          });

          it('sends the request with the ID token of the session and the app language', () => {
            const generator = sagas.sendPprGuestRequest({ firstname: 'Max', email: 'max@example.com' });

            expect(generator.next().value).toEqual(call(getIdToken));
            expect(generator.next('id-token-1').value).toEqual(
              call(remote.submitGuestRequest, { firstname: 'Max', email: 'max@example.com', language: 'en' }, 'id-token-1')
            );
            const result = { key: 'req-1', status: 'pending' };
            expect(generator.next(result)).toEqual({ value: result, done: true });
          });

          it('keeps the address the request was sent with, as the server takes it', () => {
            const generator = sagas.submitPprGuestRequest(actions.submitPprGuestRequest({ email: ' Max@Example.COM ' }));
            generator.next(); // submitGuestRequest

            const result = { key: 'req-1', status: 'pending', statusToken: 'token-1' };
            expect(generator.next({ result }).value).toEqual(
              put(actions.submitPprRequestSuccess({ ...result, email: 'max@example.com' }))
            );
          });

          it('drops the answer when the form was left before it came', () => {
            const generator = sagas.submitPprGuestRequest(actions.submitPprGuestRequest({ email: 'max@example.com' }));
            generator.next(); // submitGuestRequest

            expect(generator.next({ reset: actions.resetPprForm() }).done).toEqual(true);
          });

          it('tells a refusal for too many requests apart', () => {
            const generator = sagas.submitPprGuestRequest(actions.submitPprGuestRequest({}));
            generator.next(); // submitGuestRequest

            expect(generator.throw(refusal(429)).value).toEqual(put(actions.submitPprRequestFailure(true)));
            expect(generator.next().done).toEqual(true);
          });

          it.each([[refusal(400)], [refusal(500)], [new TypeError('Failed to fetch')]])('reports the failure %p', error => {
            const generator = sagas.submitPprGuestRequest(actions.submitPprGuestRequest({}));
            generator.next(); // submitGuestRequest

            expect(generator.throw(error).value).toEqual(put(actions.submitPprRequestFailure(false)));
          });
        });

        describe('loadPprStatus', () => {
          it('loads the request of the link', () => {
            const generator = sagas.loadPprStatus(actions.loadPprStatus('req-1', 'token-1'));

            expect(generator.next().value).toEqual(race({
              request: call(remote.loadRequestStatus, 'req-1', 'token-1'),
              reset: take(actions.RESET_PPR_STATUS),
            }));
            const request = {
              status: 'pending', immatriculation: 'HBKOF', plannedDate: '2026-11-20', plannedTime: '10:30',
              flightType: 'private', automatic: false, canWithdraw: true,
            };
            expect(generator.next({ request }).value).toEqual(put(actions.pprStatusLoaded(request)));
            expect(generator.next().done).toEqual(true);
          });

          it('drops the request when the page was left before it came', () => {
            const generator = sagas.loadPprStatus(actions.loadPprStatus('req-1', 'token-1'));
            generator.next(); // loadRequestStatus

            expect(generator.next({ reset: actions.resetPprStatus() }).done).toEqual(true);
          });

          it('tells when the link leads to no request', () => {
            const generator = sagas.loadPprStatus(actions.loadPprStatus('req-1', 'token-1'));
            generator.next(); // loadRequestStatus

            expect(generator.throw(refusal(404)).value).toEqual(put(actions.pprStatusLoadFailed('notFound')));
          });

          it.each([[refusal(500)], [new TypeError('Failed to fetch')]])('reports the failure %p', error => {
            const generator = sagas.loadPprStatus(actions.loadPprStatus('req-1', 'token-1'));
            generator.next(); // loadRequestStatus

            expect(generator.throw(error).value).toEqual(put(actions.pprStatusLoadFailed('failed')));
          });
        });

        describe('withdrawPprRequest', () => {
          it('withdraws the request of the link', () => {
            const generator = sagas.withdrawPprRequest(actions.withdrawPprRequest('req-1', 'token-1'));

            expect(generator.next().value).toEqual(race({
              withdrawn: call(remote.withdrawRequest, 'req-1', 'token-1'),
              reset: take(actions.RESET_PPR_STATUS),
            }));
            expect(generator.next({ withdrawn: { withdrawn: true } }).value)
              .toEqual(put(actions.withdrawPprRequestSuccess()));
            expect(generator.next().done).toEqual(true);
          });

          it('drops the result when the page was left before it came', () => {
            const generator = sagas.withdrawPprRequest(actions.withdrawPprRequest('req-1', 'token-1'));
            generator.next(); // withdrawRequest

            expect(generator.next({ reset: actions.resetPprStatus() }).done).toEqual(true);
          });

          it('loads a request answered in the meantime again, to show the answer', () => {
            const generator = sagas.withdrawPprRequest(actions.withdrawPprRequest('req-1', 'token-1'));
            generator.next(); // withdrawRequest

            expect(generator.throw(refusal(409)).value).toEqual(put(actions.withdrawPprRequestFailure('notPending')));
            expect(generator.next().value).toEqual(put(actions.loadPprStatus('req-1', 'token-1')));
            expect(generator.next().done).toEqual(true);
          });

          it.each([
            ['a request that no longer exists', refusal(404), 'notFound'],
            ['a failure', refusal(500), 'failed'],
            ['a network failure', new TypeError('Failed to fetch'), 'failed'],
          ] as const)('reports %s', (_, error, reason) => {
            const generator = sagas.withdrawPprRequest(actions.withdrawPprRequest('req-1', 'token-1'));
            generator.next(); // withdrawRequest

            expect(generator.throw(error).value).toEqual(put(actions.withdrawPprRequestFailure(reason)));
            expect(generator.next().done).toEqual(true);
          });
        });
      });

      describe('the watchers', () => {
        const watchers = () => (sagas.default().next().value as any).payload;

        // The store holds the state of one load (loading, loadFailed): the
        // result of an older load must not overwrite that of a newer one,
        // e.g. when the admin page and the PPR list load at the same time
        it('let a newer load of the requests replace the one running', () => {
          expect(watchers()).toContainEqual(takeLatest(actions.LOAD_PPR_REQUESTS, sagas.loadPprRequests));
        });

        it('ignore further submits without login while one is being sent', () => {
          expect(watchers()).toContainEqual(takeLeading(actions.SUBMIT_PPR_GUEST_REQUEST, sagas.submitPprGuestRequest));
        });

        // Two watchers of the form's start: its values and its closures
        it('load the closures with the form, those of the newest form only', () => {
          expect(watchers()).toContainEqual(takeEvery(actions.INIT_PPR_FORM, sagas.initPprForm));
          expect(watchers()).toContainEqual(takeLatest(actions.INIT_PPR_FORM, sagas.loadPprClosures));
        });

        it('let the load of another status link replace the one running', () => {
          expect(watchers()).toContainEqual(takeLatest(actions.LOAD_PPR_STATUS, sagas.loadPprStatus));
        });

        it('ignore further withdrawals while one is being sent', () => {
          expect(watchers()).toContainEqual(takeLeading(actions.WITHDRAW_PPR_REQUEST, sagas.withdrawPprRequest));
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
