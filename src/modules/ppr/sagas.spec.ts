import { call, put } from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';
import { getIdToken } from '../../util/firebase';

jest.mock('../../history', () => ({ history: { push: jest.fn() } }));

import { history } from '../../history';

describe('modules', () => {
  describe('ppr', () => {
    describe('sagas', () => {
      describe('loadPprRequests', () => {
        it('should load requests', () => {
          const generator = sagas.loadPprRequests();

          expect(generator.next().value).toEqual(put(actions.setPprLoading()));
          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next('token-123').value).toEqual(call(remote.loadRequests, 'token-123'));

          const data = [{ key: 'req-1' }];
          expect(generator.next(data).value).toEqual(put(actions.pprRequestsLoaded(data)));
          expect(generator.next().done).toEqual(true);
        });

        it('should dispatch loadFailed on error without clearing data', () => {
          const generator = sagas.loadPprRequests();

          generator.next(); // setPprLoading
          generator.next(); // getIdToken

          const error = new Error('network error');
          expect(generator.throw(error).value).toEqual(put(actions.pprLoadFailed()));
          expect(generator.next().done).toEqual(true);
        });
      });

      describe('submitPprRequest', () => {
        it('should submit request successfully', () => {
          const values = { firstname: 'Max' };
          const action = actions.submitPprRequest(values);
          const generator = sagas.submitPprRequest(action);

          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next('token-123').value).toEqual(
            call(remote.submitRequest, values, 'token-123')
          );
          expect(generator.next().value).toEqual(put(actions.submitPprRequestSuccess()));
          expect(generator.next().done).toEqual(true);
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
          expect(generator.next().value).toEqual(call(sagas.loadPprRequests));
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
          expect(reloadStep.value).toEqual(call(sagas.loadPprRequests));
          // Reload fails — caught by inner try/catch, not the review catch
          const afterThrow = generator.throw(new Error('reload failed'));
          expect(afterThrow.done).toEqual(true);
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
