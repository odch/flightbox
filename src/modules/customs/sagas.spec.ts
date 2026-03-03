import {call, put} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import {getIdToken} from '../../util/firebase';
import {get as getAerodrome} from '../../util/aerodromes';

jest.mock('../../util/firebase');
jest.mock('../../util/aerodromes');

describe('modules', () => {
  describe('customs', () => {
    describe('sagas', () => {
      beforeEach(() => {
        global.__FIREBASE_PROJECT_ID__ = 'test-project';
        global.__CONF__ = { aerodrome: { ICAO: 'LSZT' } };
        global.fetch = jest.fn();
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

      describe('getDirectionDependingData', () => {
        it('should return departure data for departure type', async () => {
          (getAerodrome as jest.Mock).mockResolvedValue({ country: 'CH', name: 'Birrfeld' });

          const movementData = {
            type: 'departure',
            location: 'LSZF',
            time: '10:00',
            duration: '01:30'
          };

          const result = await sagas.getDirectionDependingData(movementData);

          expect(result).toMatchObject({
            departureTime: '10:00',
            arrivalCountry: 'CH',
            arrivalLocation: 'Birrfeld',
            arrivalTime: '11:30'
          });
        });

        it('should return arrival data for arrival type', async () => {
          (getAerodrome as jest.Mock).mockResolvedValue({ country: 'DE', name: 'Friedrichshafen' });

          const movementData = {
            type: 'arrival',
            location: 'EDNY',
            time: '14:00'
          };

          const result = await sagas.getDirectionDependingData(movementData);

          expect(result).toMatchObject({
            arrivalTime: '14:00',
            departureCountry: 'DE',
            departureLocation: 'Friedrichshafen'
          });
        });
      });

      describe('openCompletionUrl', () => {
        it('should open a new window with the url', () => {
          const openMock = jest.fn().mockReturnValue({});
          window.open = openMock;

          sagas.openCompletionUrl('https://example.com/complete');

          expect(openMock).toHaveBeenCalledWith(
            'https://example.com/complete',
            '_blank',
            'noopener,noreferrer'
          );
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

      describe('startCustoms with result without completionUrl', () => {
        it('should not open url if result has no completionUrl', () => {
          const movementData = { type: 'departure', key: 'movement-key' };
          const action = actions.startCustoms(movementData);
          const generator = sagas.startCustoms(action);

          expect(generator.next().value).toEqual(put(actions.setStartCustomsLoading()));
          expect(generator.next().value).toEqual(call(sagas.getCustomsPayload, movementData));

          const payload = { aerodromeId: 'lszt' };
          expect(generator.next(payload).value).toEqual(call(sagas.postPrepopulatedFormToCustoms, payload));

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
          expect(generator.next().value).toEqual(call(sagas.getCustomsPayload, movementData));

          const payload = { aerodromeId: 'lszt' };
          expect(generator.next(payload).value).toEqual(call(sagas.postPrepopulatedFormToCustoms, payload));

          const result = { id: 'form-id', completionUrl: 'https://example.com/complete' };
          expect(generator.next(result).value).toEqual(
            call(sagas.saveCustomsFormData, movementData, result.id, result.completionUrl)
          );

          // The inner try/catch catches the error, logs it, then continues.
          // After the inner catch, the generator calls openCompletionUrl (sync)
          // and then yields put(setStartCustomsSuccess())
          const saveError = new Error('save failed');
          expect(generator.throw(saveError).value).toEqual(put(actions.setStartCustomsSuccess()));
          expect(generator.next().done).toEqual(true);
        });
      });

      describe('checkAvailability', () => {
        it('should put setCustomsAvailability(true) when available', () => {
          const generator = sagas.checkAvailability();

          expect(generator.next().value).toEqual(call(getIdToken));

          const idToken = 'test-token';
          const url = 'https://europe-west1-test-project.cloudfunctions.net/api/customs/availability';
          expect(generator.next(idToken).value).toEqual(
            call(fetch, url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
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
          const url = 'https://europe-west1-test-project.cloudfunctions.net/api/customs/availability';
          expect(generator.next(idToken).value).toEqual(
            call(fetch, url, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`
              }
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

        it('should throw error and put setCustomsAvailability(false) when response is not ok', () => {
          const generator = sagas.checkAvailability();

          expect(generator.next().value).toEqual(call(getIdToken));

          const idToken = 'test-token';
          const url = 'https://europe-west1-test-project.cloudfunctions.net/api/customs/availability';
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
