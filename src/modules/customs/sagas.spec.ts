import {call, put} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import {getIdToken} from '../../util/firebase';

jest.mock('../../util/firebase');

describe('modules', () => {
  describe('customs', () => {
    describe('sagas', () => {
      beforeEach(() => {
        global.__FIREBASE_PROJECT_ID__ = 'test-project';
        global.fetch = jest.fn();
      });

      describe('getPathByMovementType', () => {
        it('should return /departures for departure', () => {
          expect(sagas.getPathByMovementType('departure')).toEqual('/departures');
        });

        it('should return /arrivals for arrival', () => {
          expect(sagas.getPathByMovementType('arrival')).toEqual('/arrivals');
        });

        it('should throw for unknown movement type', () => {
          expect(() => sagas.getPathByMovementType('unknown')).toThrow(Error);
        });
      });

      describe('openCompletionUrl', () => {
        it('opens https completion URLs', () => {
          const openMock = jest.fn();
          window.open = openMock;
          sagas.openCompletionUrl('https://customs.example/forms/abc');
          expect(openMock).toHaveBeenCalledWith('https://customs.example/forms/abc', '_blank', 'noopener,noreferrer');
        });

        it('refuses non-https and invalid completion URLs', () => {
          const openMock = jest.fn();
          window.open = openMock;
          sagas.openCompletionUrl('javascript:alert(1)');
          sagas.openCompletionUrl('http://evil.example');
          sagas.openCompletionUrl('data:text/html,x');
          sagas.openCompletionUrl('not a url');
          expect(openMock).not.toHaveBeenCalled();
        });

        it('should warn when popup is blocked', () => {
          const openMock = jest.fn().mockReturnValue(null);
          window.open = openMock;
          const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

          sagas.openCompletionUrl('https://example.com/complete');

          expect(warnSpy).toHaveBeenCalled();
          warnSpy.mockRestore();
        });
      });

      describe('startCustoms', () => {
        it('should open completion URL and return early if customsFormId and customsFormUrl exist', () => {
          const openMock = jest.fn();
          window.open = openMock;

          const movementData = {
            customsFormId: 'form-123',
            customsFormUrl: 'https://example.com/form'
          };
          const action = actions.startCustoms(movementData);
          const generator = sagas.startCustoms(action);

          const result = generator.next();
          expect(result.done).toEqual(true);
          expect(result.value).toEqual(undefined);
        });

        it('sends only a movement reference to the server (no client-built payload)', () => {
          const movementData = { type: 'departure', key: 'movement-key' };
          const action = actions.startCustoms(movementData);
          const generator = sagas.startCustoms(action);

          expect(generator.next().value).toEqual(put(actions.setStartCustomsLoading()));
          expect(generator.next().value).toEqual(
            call(sagas.postPrepopulatedFormToCustoms, { movementType: 'departure', movementKey: 'movement-key' })
          );
        });

        it('should put setStartCustomsSuccess after posting form', () => {
          const movementData = { type: 'departure', key: 'movement-key' };
          const action = actions.startCustoms(movementData);
          const generator = sagas.startCustoms(action);

          expect(generator.next().value).toEqual(put(actions.setStartCustomsLoading()));
          expect(generator.next().value).toEqual(
            call(sagas.postPrepopulatedFormToCustoms, { movementType: 'departure', movementKey: 'movement-key' })
          );

          const result = { id: 'form-id', completionUrl: 'https://example.com/complete' };
          expect(generator.next(result).value).toEqual(
            call(sagas.saveCustomsFormData, movementData, result.id, result.completionUrl)
          );

          expect(generator.next().value).toEqual(put(actions.setStartCustomsSuccess()));
          expect(generator.next().done).toEqual(true);
        });

        it('should put setStartCustomsFailure on error', () => {
          const movementData = { type: 'departure', key: 'movement-key' };
          const action = actions.startCustoms(movementData);
          const generator = sagas.startCustoms(action);

          expect(generator.next().value).toEqual(put(actions.setStartCustomsLoading()));
          expect(generator.next().value).toEqual(
            call(sagas.postPrepopulatedFormToCustoms, { movementType: 'departure', movementKey: 'movement-key' })
          );

          const error = new Error('Network error');
          expect(generator.throw(error).value).toEqual(
            put(actions.setStartCustomsFailure('Network error'))
          );
          expect(generator.next().done).toEqual(true);
        });

        it('should not open url if result has no completionUrl', () => {
          const movementData = { type: 'departure', key: 'movement-key' };
          const action = actions.startCustoms(movementData);
          const generator = sagas.startCustoms(action);

          expect(generator.next().value).toEqual(put(actions.setStartCustomsLoading()));
          expect(generator.next().value).toEqual(
            call(sagas.postPrepopulatedFormToCustoms, { movementType: 'departure', movementKey: 'movement-key' })
          );

          // result with no id and no completionUrl
          const result = { someOtherField: true };
          expect(generator.next(result).value).toEqual(put(actions.setStartCustomsSuccess()));
          expect(generator.next().done).toEqual(true);
        });

        it('should handle failed saveCustomsFormData gracefully and still succeed', () => {
          const openMock = jest.fn().mockReturnValue({});
          window.open = openMock;

          const movementData = { type: 'departure', key: 'movement-key' };
          const action = actions.startCustoms(movementData);
          const generator = sagas.startCustoms(action);

          expect(generator.next().value).toEqual(put(actions.setStartCustomsLoading()));
          expect(generator.next().value).toEqual(
            call(sagas.postPrepopulatedFormToCustoms, { movementType: 'departure', movementKey: 'movement-key' })
          );

          const result = { id: 'form-id', completionUrl: 'https://example.com/complete' };
          expect(generator.next(result).value).toEqual(
            call(sagas.saveCustomsFormData, movementData, result.id, result.completionUrl)
          );

          // The inner try/catch catches the error, logs it, then continues to
          // openCompletionUrl (sync) and yields put(setStartCustomsSuccess()).
          const saveError = new Error('save failed');
          expect(generator.throw(saveError).value).toEqual(put(actions.setStartCustomsSuccess()));
          expect(generator.next().done).toEqual(true);
        });
      });

      describe('checkAvailability', () => {
        const availabilityUrl = 'https://europe-west1-test-project.cloudfunctions.net/api/customs/availability';

        it('should put setCustomsAvailability(true) when available', () => {
          const generator = sagas.checkAvailability();

          expect(generator.next().value).toEqual(call(getIdToken));

          const idToken = 'test-token';
          expect(generator.next(idToken).value).toEqual(
            call(fetch, availabilityUrl, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${idToken}` }
            })
          );

          const response = { ok: true } as any;
          expect(generator.next(response).value).toEqual(call([response, response.json]));

          expect(generator.next({ available: true }).value).toEqual(
            put(actions.setCustomsAvailability(true))
          );

          expect(generator.next().done).toEqual(true);
        });

        it('should put setCustomsAvailability(false) when not available', () => {
          const generator = sagas.checkAvailability();

          expect(generator.next().value).toEqual(call(getIdToken));

          const idToken = 'test-token';
          expect(generator.next(idToken).value).toEqual(
            call(fetch, availabilityUrl, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${idToken}` }
            })
          );

          const response = { ok: true } as any;
          expect(generator.next(response).value).toEqual(call([response, response.json]));

          expect(generator.next({ available: false }).value).toEqual(
            put(actions.setCustomsAvailability(false))
          );

          expect(generator.next().done).toEqual(true);
        });

        it('should put setCustomsAvailability(false) on error', () => {
          const generator = sagas.checkAvailability();

          expect(generator.next().value).toEqual(call(getIdToken));

          const error = new Error('Network error');
          expect(generator.throw(error).value).toEqual(
            put(actions.setCustomsAvailability(false))
          );

          expect(generator.next().done).toEqual(true);
        });

        it('should put setCustomsAvailability(false) when response is not ok', () => {
          const generator = sagas.checkAvailability();

          expect(generator.next().value).toEqual(call(getIdToken));

          const idToken = 'test-token';
          expect(generator.next(idToken).value).toEqual(
            call(fetch, availabilityUrl, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${idToken}` }
            })
          );

          const response = { ok: false, status: 500, statusText: 'Internal Server Error' };
          expect(generator.next(response).value).toEqual(
            put(actions.setCustomsAvailability(false))
          );

          expect(generator.next().done).toEqual(true);
        });
      });
    });
  });
});
