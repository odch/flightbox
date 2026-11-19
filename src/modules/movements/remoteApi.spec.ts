jest.mock('../../util/firebase');

import {getIdToken} from '../../util/firebase';
import {
  MovementApiError,
  hasPendingMovementWrites,
  movementWritesSettled,
  movementsApiUrl,
  saveMovementViaApi,
} from './remoteApi';

const API = 'https://europe-west1-flightbox-test.cloudfunctions.net/api/app/movements';

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

const htmlResponse = (status: number) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.reject(new SyntaxError('Unexpected token <')),
});

const envelope = (code: string, message: string, details?: unknown) => ({
  error: details === undefined ? {code, message} : {code, message, details},
});

describe('modules', () => {
  describe('movements/remoteApi', () => {
    const originalFetch = global.fetch;
    let fetchMock: jest.Mock;

    const rejection = (promise: Promise<unknown>) => promise.then(
      () => { throw new Error('expected a rejection'); },
      error => error
    );

    beforeEach(() => {
      jest.clearAllMocks();
      (global as any).__FIREBASE_PROJECT_ID__ = 'flightbox-test';
      (getIdToken as jest.Mock).mockResolvedValue('id-token');
      fetchMock = jest.fn();
      global.fetch = fetchMock;
    });

    afterEach(() => {
      delete (global as any).__FIREBASE_PROJECT_ID__;
      global.fetch = originalFetch;
    });

    describe('pending writes', () => {
      const deferred = () => {
        let resolve: (value: unknown) => void = () => undefined;
        let reject: (reason: unknown) => void = () => undefined;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return {promise, resolve, reject};
      };

      it('has none and settles at once without writes', async () => {
        expect(hasPendingMovementWrites()).toBe(false);
        await expect(movementWritesSettled()).resolves.toBeUndefined();
      });

      it('tracks a write until it has succeeded', async () => {
        const response = deferred();
        fetchMock.mockReturnValue(response.promise);
        const settled = jest.fn();

        const write = saveMovementViaApi('/arrivals', 'key', {paymentMethod: {method: 'checkout'}});
        expect(hasPendingMovementWrites()).toBe(true);
        movementWritesSettled().then(settled);
        await Promise.resolve();
        expect(settled).not.toHaveBeenCalled();

        response.resolve(jsonResponse(200, {key: 'key'}));
        await expect(write).resolves.toBe('key');
        await movementWritesSettled();
        expect(settled).toHaveBeenCalled();
        expect(hasPendingMovementWrites()).toBe(false);
      });

      it('tracks a write until it has failed, and settles without rejecting', async () => {
        const response = deferred();
        fetchMock.mockReturnValue(response.promise);

        const write = saveMovementViaApi('/arrivals', 'key', {});
        const settled = movementWritesSettled();
        response.reject(new TypeError('Failed to fetch'));

        await expect(write).rejects.toBeInstanceOf(MovementApiError);
        await expect(settled).resolves.toBeUndefined();
        expect(hasPendingMovementWrites()).toBe(false);
      });
    });

    describe('movementsApiUrl', () => {
      it('addresses the api function of the Firebase project', () => {
        expect(movementsApiUrl('departures')).toBe(`${API}/departures`);
        expect(movementsApiUrl('arrivals', 'abc')).toBe(`${API}/arrivals/abc`);
      });

      it('encodes the key', () => {
        expect(movementsApiUrl('arrivals', 'a/b?c')).toBe(`${API}/arrivals/a%2Fb%3Fc`);
      });
    });

    describe('saveMovementViaApi', () => {
      it('sends the movement unchanged as JSON', async () => {
        fetchMock.mockResolvedValue(jsonResponse(201, {key: 'new-key'}));
        const movement = {
          immatriculation: 'HBKOF',
          negativeTimestamp: -1475992800000,
          createdBy: 'pilot@example.com',
          createdBy_orderKey: 'pilot@example.com_8524007199999',
          privacyPolicyAcceptedAt: '2016-10-09T06:00:00.000Z',
        };

        await saveMovementViaApi('/departures', undefined, movement);

        const [, init] = fetchMock.mock.calls[0];
        expect(JSON.parse(init.body)).toEqual(movement);
      });

      it('accepts a path without leading slash', async () => {
        fetchMock.mockResolvedValue(jsonResponse(201, {key: 'new-key'}));
        await saveMovementViaApi('arrivals', null, {});
        expect(fetchMock.mock.calls[0][0]).toBe(`${API}/arrivals`);
      });

      it('rejects an unknown path without sending anything', async () => {
        await expect(saveMovementViaApi('/users', null, {})).rejects.toThrow('Unknown movement path: /users');
        expect(getIdToken).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it.each([
        [401, 'unauthenticated', 'Unauthenticated'],
        [403, 'permission-denied', 'Not allowed to write this movement'],
        [404, 'not-found', 'Movement not found'],
        [409, 'failed-precondition', 'Movement is locked'],
        [500, 'internal', 'Internal error'],
      ])('maps HTTP %s with code %s from the envelope', async (status, code, message) => {
        fetchMock.mockResolvedValue(jsonResponse(status, envelope(code, message, {reason: 'some-reason'})));

        const error = await rejection(saveMovementViaApi('/arrivals', 'key', {}));

        expect(error).toBeInstanceOf(MovementApiError);
        expect(error).toBeInstanceOf(Error);
        expect(error).toMatchObject({message, status, code, reason: 'some-reason', validationErrors: []});
      });

      it('keeps an envelope without details', async () => {
        fetchMock.mockResolvedValue(jsonResponse(500, envelope('internal', 'Internal error')));

        const error = await rejection(saveMovementViaApi('/arrivals', 'key', {}));

        expect(error).toMatchObject({message: 'Internal error', code: 'internal', reason: null, validationErrors: []});
      });

      it('names at most five fields of the validation errors in the message', async () => {
        const fields = ['runway', 'runway', 'a', 'b', 'c', 'd', 'e'];
        fetchMock.mockResolvedValue(jsonResponse(400, envelope('invalid-argument', 'Validation failed', {
          reason: 'validation-failed',
          validationErrors: fields.map(field => ({field, reason: 'required'})),
        })));

        const error = await rejection(saveMovementViaApi('/departures', null, {}));

        expect(error.message).toBe('Validation failed: runway, a, b, c, d, ...');
        expect(error.validationErrors).toHaveLength(7);
      });

      it('ignores malformed validation error entries', async () => {
        fetchMock.mockResolvedValue(jsonResponse(400, envelope('invalid-argument', 'Validation failed', {
          validationErrors: [null, 'runway', {field: 'dateTime', reason: 'invalid-format'}],
        })));

        const error = await rejection(saveMovementViaApi('/departures', null, {}));

        expect(error.validationErrors).toEqual([{field: 'dateTime', reason: 'invalid-format'}]);
        expect(error.message).toBe('Validation failed: dateTime');
      });

      it('reports a response without envelope by its status', async () => {
        fetchMock.mockResolvedValue(htmlResponse(502));

        const error = await rejection(saveMovementViaApi('/departures', null, {}));

        expect(error).toMatchObject({
          message: 'Request failed (HTTP 502)',
          status: 502,
          code: 'unknown',
          reason: null,
          validationErrors: [],
        });
      });

      it('reports a JSON error body that is not the envelope by its status', async () => {
        fetchMock.mockResolvedValue(jsonResponse(404, {error: 'Not found'}));

        const error = await rejection(saveMovementViaApi('/departures', null, {}));

        expect(error).toMatchObject({message: 'Request failed (HTTP 404)', status: 404, code: 'unknown'});
      });

      it('rejects a network failure without quoting it', async () => {
        fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

        const error = await rejection(saveMovementViaApi('/departures', null, {}));

        expect(error).toMatchObject({
          message: 'Network error: it is unknown whether the movement was saved, check the list before saving again',
          status: 0,
          code: 'unavailable',
          reason: 'network-error',
        });
      });

      it('reports a token refresh that fails offline as a network error without sending', async () => {
        (getIdToken as jest.Mock).mockRejectedValue(
          Object.assign(new Error('Firebase: Error (auth/network-request-failed).'), {
            code: 'auth/network-request-failed',
          })
        );

        const error = await rejection(saveMovementViaApi('/arrivals', 'key', {paymentMethod: {method: 'invoice'}}));

        expect(error).toMatchObject({
          message: 'Network error: the movement could not be sent',
          status: 0,
          code: 'unavailable',
          reason: 'network-error',
        });
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('reports any other token error as a failed sign-in check without quoting it', async () => {
        (getIdToken as jest.Mock).mockRejectedValue(
          Object.assign(new Error('Firebase: Error (auth/user-token-expired).'), {code: 'auth/user-token-expired'})
        );

        const error = await rejection(saveMovementViaApi('/departures', null, {}));

        expect(error).toMatchObject({
          message: 'Could not verify the sign-in',
          status: 0,
          code: 'unauthenticated',
          reason: 'id-token-failed',
        });
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('rejects without sending when there is no ID token', async () => {
        (getIdToken as jest.Mock).mockImplementation(() => {
          throw new TypeError("Cannot read properties of null (reading 'getIdToken')");
        });

        const error = await rejection(saveMovementViaApi('/departures', null, {}));

        expect(error).toMatchObject({status: 0, code: 'unauthenticated', reason: 'no-id-token'});
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it.each([
        ['no key', {}],
        ['an empty key', {key: ''}],
        ['a non-string key', {key: 42}],
        ['no JSON object', null],
      ])('rejects a success response with %s', async (_, body) => {
        fetchMock.mockResolvedValue(jsonResponse(200, body));

        const error = await rejection(saveMovementViaApi('/arrivals', 'key', {}));

        expect(error).toMatchObject({status: 200, code: 'internal', reason: 'invalid-response'});
      });
    });
  });
});
