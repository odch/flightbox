import {call, put} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import {getIdToken} from '../../util/firebase.js';

jest.mock('../../util/firebase.js');

describe('modules', () => {
  describe('customs', () => {
    describe('sagas', () => {
      beforeEach(() => {
        global.__FIREBASE_PROJECT_ID__ = 'test-project';
        global.__CONF__ = { aerodrome: { ICAO: 'LSZT' } };
      });

      describe('getCustomsAircraftType', () => {
        it('should return helicopter for Hubschrauber', () => {
          expect(sagas.getCustomsAircraftType('Hubschrauber')).toEqual('helicopter');
        });

        it('should return helicopter for Eigenbauhubschrauber', () => {
          expect(sagas.getCustomsAircraftType('Eigenbauhubschrauber')).toEqual('helicopter');
        });

        it('should return airplane for other categories', () => {
          expect(sagas.getCustomsAircraftType('C172')).toEqual('airplane');
        });
      });

      describe('parseDuration', () => {
        it('should parse duration string into hours and minutes', () => {
          expect(sagas.parseDuration('01:30')).toEqual({ hours: 1, minutes: 30 });
        });
      });

      describe('calculateTimeWithDuration', () => {
        it('should add duration to time', () => {
          expect(sagas.calculateTimeWithDuration('10:00', '01:30', 'add')).toEqual('11:30');
        });

        it('should subtract duration from time', () => {
          expect(sagas.calculateTimeWithDuration('10:00', '01:30', 'subtract')).toEqual('08:30');
        });
      });

      describe('calculateArrivalTime', () => {
        it('should calculate arrival time by adding duration to departure time', () => {
          expect(sagas.calculateArrivalTime('10:00', '01:30')).toEqual('11:30');
        });
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

      describe('startCustoms', () => {
        it('should open completion URL and return early if customsFormId and customsFormUrl exist', () => {
          const openMock = jest.fn();
          global.open = openMock;
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

        it('should put setStartCustomsLoading and proceed if no customsFormId', () => {
          const movementData = {
            type: 'departure',
            key: 'movement-key'
          };
          const action = actions.startCustoms(movementData);
          const generator = sagas.startCustoms(action);

          expect(generator.next().value).toEqual(put(actions.setStartCustomsLoading()));
          expect(generator.next().value).toEqual(call(sagas.getCustomsPayload, movementData));
        });

        it('should put setStartCustomsSuccess after posting form', () => {
          const movementData = {
            type: 'departure',
            key: 'movement-key'
          };
          const action = actions.startCustoms(movementData);
          const generator = sagas.startCustoms(action);

          expect(generator.next().value).toEqual(put(actions.setStartCustomsLoading()));
          expect(generator.next().value).toEqual(call(sagas.getCustomsPayload, movementData));

          const payload = { aerodromeId: 'lszt' };
          expect(generator.next(payload).value).toEqual(call(sagas.postPrepopulatedFormToCustoms, payload));

          const result = { id: 'form-id', completionUrl: 'https://example.com/complete' };
          expect(generator.next(result).value).toEqual(
            call(sagas.saveCustomsFormData, movementData, result.id, result.completionUrl)
          );

          expect(generator.next().value).toEqual(put(actions.setStartCustomsSuccess()));
          expect(generator.next().done).toEqual(true);
        });

        it('should put setStartCustomsFailure on error', () => {
          const movementData = {
            type: 'departure',
            key: 'movement-key'
          };
          const action = actions.startCustoms(movementData);
          const generator = sagas.startCustoms(action);

          expect(generator.next().value).toEqual(put(actions.setStartCustomsLoading()));
          expect(generator.next().value).toEqual(call(sagas.getCustomsPayload, movementData));

          const error = new Error('Network error');
          expect(generator.throw(error).value).toEqual(
            put(actions.setStartCustomsFailure('Network error'))
          );
          expect(generator.next().done).toEqual(true);
        });
      });

      describe('checkAvailability', () => {
        it('should put setCustomsAvailability(true) when available', () => {
          const generator = sagas.checkAvailability();

          expect(generator.next().value).toEqual(call(getIdToken));

          const idToken = 'test-token';
          const url = 'https://us-central1-test-project.cloudfunctions.net/api/customs/availability';
          expect(generator.next(idToken).value).toEqual(
            call(fetch, url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            })
          );

          const response = { ok: true };
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
          const url = 'https://us-central1-test-project.cloudfunctions.net/api/customs/availability';
          expect(generator.next(idToken).value).toEqual(
            call(fetch, url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
            })
          );

          const response = { ok: true };
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

        it('should throw error and put setCustomsAvailability(false) when response is not ok', () => {
          const generator = sagas.checkAvailability();

          expect(generator.next().value).toEqual(call(getIdToken));

          const idToken = 'test-token';
          const url = 'https://us-central1-test-project.cloudfunctions.net/api/customs/availability';
          expect(generator.next(idToken).value).toEqual(
            call(fetch, url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
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
