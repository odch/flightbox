jest.mock('../../util/firebase');
jest.mock('firebase/database', () => ({
  get: jest.fn(),
  child: jest.fn(),
  query: jest.fn(),
  orderByChild: jest.fn(),
  startAt: jest.fn(),
  limitToFirst: jest.fn(),
  endAt: jest.fn(),
  onValue: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  push: jest.fn(),
}));

import firebase, {getIdToken} from '../../util/firebase';
import {get, child, query, orderByChild, startAt, limitToFirst, endAt, onValue, remove, update, push} from 'firebase/database';
import {
  loadLimited, loadByKey, removeMovement, saveMovement, movementWritesViaApi,
  addMovementAssociationListener, removeMovementAssociationListener
} from './remote';
import {toOrderKey} from './pagination';

describe('modules', () => {
  describe('movements/remote', () => {
    let mockRef;
    let queryRef;
    let childRef;
    let mockSnapshot;

    beforeEach(() => {
      jest.clearAllMocks();

      mockRef = {};
      queryRef = {};
      childRef = {};
      mockSnapshot = {val: () => ({})};

      (firebase as jest.Mock).mockReturnValue(mockRef);
      (query as jest.Mock).mockReturnValue(queryRef);
      (child as jest.Mock).mockReturnValue(childRef);
      (get as jest.Mock).mockResolvedValue(mockSnapshot);
      (remove as jest.Mock).mockResolvedValue(undefined);
      (update as jest.Mock).mockResolvedValue(undefined);
      (push as jest.Mock).mockResolvedValue({key: 'new-key'});
      (onValue as jest.Mock).mockReturnValue(jest.fn());
    });

    describe('loadLimited', () => {
      it('resolves with snapshot and ref', async () => {
        const result = await loadLimited('/departures', null, 10, undefined, undefined);
        expect(result).toHaveProperty('snapshot', mockSnapshot);
        expect(result).toHaveProperty('ref');
        expect(limitToFirst).toHaveBeenCalledWith(10);
      });

      it('uses endAt when no limit provided', async () => {
        await loadLimited('/departures', null, null, 'endVal', undefined);
        expect(endAt).toHaveBeenCalled();
      });

      it('uses createdBy ordering when provided', async () => {
        await loadLimited('/departures', null, 5, null, 'user123');
        expect(orderByChild).toHaveBeenCalledWith('createdBy_orderKey');
      });

      it('bounds createdBy queries to the user prefix (start, end and limit)', async () => {
        await loadLimited('/departures', null, 5, null, 'user123');
        expect(startAt).toHaveBeenCalledWith('user123_');
        expect(endAt).toHaveBeenCalledWith('user123_');
        expect(limitToFirst).toHaveBeenCalledWith(5);
      });

      it('aligns numeric createdBy start/end bounds to the order key', async () => {
        await loadLimited('/departures', -100, null, -50, 'user123');
        expect(startAt).toHaveBeenCalledWith(toOrderKey('user123', -100));
        expect(endAt).toHaveBeenCalledWith(toOrderKey('user123', -50));
      });
    });

    describe('loadByKey', () => {
      it('resolves with snapshot', async () => {
        const result = await loadByKey('/departures', 'key123');
        expect(child).toHaveBeenCalledWith(mockRef, 'key123');
        expect(result).toBe(mockSnapshot);
      });
    });

    describe('removeMovement', () => {
      it('resolves when firebase remove succeeds', async () => {
        await expect(removeMovement('/departures', 'key123')).resolves.toBeUndefined();
        expect(child).toHaveBeenCalledWith(mockRef, 'key123');
        expect(remove).toHaveBeenCalledWith(childRef);
      });

      it('rejects when firebase remove fails', async () => {
        (remove as jest.Mock).mockRejectedValue(new Error('Permission denied'));
        await expect(removeMovement('/departures', 'key123')).rejects.toThrow('Permission denied');
      });
    });

    describe('saveMovement', () => {
      it('updates existing movement when key is provided', async () => {
        const result = await saveMovement('/departures', 'existing-key', {immatriculation: 'HBKOF'});
        expect(child).toHaveBeenCalledWith(mockRef, 'existing-key');
        expect(update).toHaveBeenCalled();
        expect(result).toBe('existing-key');
      });

      it('pushes new movement when no key provided', async () => {
        const result = await saveMovement('/departures', null, {immatriculation: 'HBKOF'});
        expect(push).toHaveBeenCalled();
        expect(result).toBe('new-key');
      });

      it('rejects when firebase operation fails', async () => {
        (update as jest.Mock).mockRejectedValue(new Error('Save failed'));
        await expect(saveMovement('/departures', 'key', {})).rejects.toThrow('Save failed');
      });

      describe('with movementWritesViaApi', () => {
        const API = 'https://europe-west1-flightbox-test.cloudfunctions.net/api/app/movements';
        const originalFetch = global.fetch;
        let fetchMock: jest.Mock;

        const jsonResponse = (status: number, body: unknown) => ({
          ok: status >= 200 && status < 300,
          status,
          json: () => Promise.resolve(body),
        });

        const sentRequest = () => {
          const [url, init] = fetchMock.mock.calls[0];
          return {url, method: init.method, headers: init.headers, body: JSON.parse(init.body)};
        };

        beforeEach(() => {
          (global as any).__FIREBASE_PROJECT_ID__ = 'flightbox-test';
          (global as any).__CONF__ = {movementWritesViaApi: true};
          (getIdToken as jest.Mock).mockResolvedValue('id-token');
          fetchMock = jest.fn();
          global.fetch = fetchMock;
        });

        afterEach(() => {
          delete (global as any).__CONF__;
          delete (global as any).__FIREBASE_PROJECT_ID__;
          global.fetch = originalFetch;
        });

        it('creates a movement with POST and resolves to the new key', async () => {
          fetchMock.mockResolvedValue(jsonResponse(201, {key: 'api-key'}));
          const movement = {immatriculation: 'HBKOF', createdBy: 'pilot@example.com'};

          await expect(saveMovement('/departures', null, movement)).resolves.toBe('api-key');

          expect(sentRequest()).toEqual({
            url: `${API}/departures`,
            method: 'POST',
            headers: {
              'Authorization': 'Bearer id-token',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: movement,
          });
          expect(push).not.toHaveBeenCalled();
          expect(update).not.toHaveBeenCalled();
        });

        it('updates a movement with PATCH on its key', async () => {
          fetchMock.mockResolvedValue(jsonResponse(200, {key: 'arr-key'}));

          await expect(saveMovement('/arrivals', 'arr-key', {remarks: null})).resolves.toBe('arr-key');

          const request = sentRequest();
          expect(request.url).toBe(`${API}/arrivals/arr-key`);
          expect(request.method).toBe('PATCH');
          expect(request.body).toEqual({remarks: null});
          expect(update).not.toHaveBeenCalled();
        });

        it('patches only the payment method (saveMovementPaymentMethod)', async () => {
          fetchMock.mockResolvedValue(jsonResponse(200, {key: 'arr-key'}));
          const paymentMethod = {method: 'card', status: 'completed'};

          await saveMovement('/arrivals', 'arr-key', {paymentMethod});

          const request = sentRequest();
          expect(request.method).toBe('PATCH');
          expect(request.url).toBe(`${API}/arrivals/arr-key`);
          expect(request.body).toEqual({paymentMethod});
        });

        it('rejects with the validation errors of the envelope', async () => {
          fetchMock.mockResolvedValue(jsonResponse(400, {
            error: {
              code: 'invalid-argument',
              message: 'Validation failed',
              details: {
                reason: 'validation-failed',
                validationErrors: [{field: 'runway', reason: 'not-allowed'}],
              },
            },
          }));

          const error = await saveMovement('/departures', null, {}).catch(e => e);

          expect(error).toBeInstanceOf(Error);
          expect(error).toMatchObject({
            message: 'Validation failed: runway',
            status: 400,
            code: 'invalid-argument',
            reason: 'validation-failed',
            validationErrors: [{field: 'runway', reason: 'not-allowed'}],
          });
        });

        it('rejects when the network request fails', async () => {
          fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

          const error = await saveMovement('/departures', 'key', {}).catch(e => e);

          expect(error).toBeInstanceOf(Error);
          expect(error).toMatchObject({status: 0, code: 'unavailable', reason: 'network-error'});
          expect(update).not.toHaveBeenCalled();
        });

        it('writes to the database when the flag is not exactly true', async () => {
          (global as any).__CONF__ = {movementWritesViaApi: 'true'};

          await expect(saveMovement('/departures', null, {})).resolves.toBe('new-key');

          expect(push).toHaveBeenCalledWith(mockRef, {});
          expect(fetchMock).not.toHaveBeenCalled();
        });
      });

      describe('without movementWritesViaApi', () => {
        const originalFetch = global.fetch;
        let fetchMock: jest.Mock;

        beforeEach(() => {
          fetchMock = jest.fn();
          global.fetch = fetchMock;
        });

        afterEach(() => {
          delete (global as any).__CONF__;
          global.fetch = originalFetch;
        });

        it.each([
          ['no configuration', undefined],
          ['the flag absent', {}],
          ['the flag false', {movementWritesViaApi: false}],
        ])('writes to the database with %s', async (_, conf) => {
          (global as any).__CONF__ = conf;
          const movement = {immatriculation: 'HBKOF'};

          await expect(saveMovement('/departures', null, movement)).resolves.toBe('new-key');
          await expect(saveMovement('/departures', 'key', movement)).resolves.toBe('key');

          expect(push).toHaveBeenCalledWith(mockRef, movement);
          expect(child).toHaveBeenCalledWith(mockRef, 'key');
          expect(update).toHaveBeenCalledWith(childRef, movement);
          expect(fetchMock).not.toHaveBeenCalled();
          expect(getIdToken).not.toHaveBeenCalled();
        });
      });
    });

    describe('movementWritesViaApi', () => {
      afterEach(() => {
        delete (global as any).__CONF__;
      });

      it.each([
        [undefined, false],
        [null, false],
        [{}, false],
        [{movementWritesViaApi: 'true'}, false],
        [{movementWritesViaApi: false}, false],
        [{movementWritesViaApi: true}, true],
      ])('is true only for the flag exactly true (%p)', (conf, expected) => {
        (global as any).__CONF__ = conf;
        expect(movementWritesViaApi()).toBe(expected);
      });
    });

    describe('addMovementAssociationListener', () => {
      it('listens on correct firebase path for departure', () => {
        const cb = jest.fn();
        addMovementAssociationListener('departure', 'dep-key', cb);
        expect(child).toHaveBeenCalledWith(expect.anything(), 'departures');
        expect(onValue).toHaveBeenCalledWith(expect.anything(), cb);
      });

      it('listens on correct firebase path for arrival', () => {
        const cb = jest.fn();
        addMovementAssociationListener('arrival', 'arr-key', cb);
        expect(child).toHaveBeenCalledWith(expect.anything(), 'arrivals');
      });
    });

    describe('removeMovementAssociationListener', () => {
      it('calls unsubscribe function for departure', () => {
        const mockUnsubscribe = jest.fn();
        (onValue as jest.Mock).mockReturnValue(mockUnsubscribe);

        addMovementAssociationListener('departure', 'dep-key-r1', jest.fn());
        removeMovementAssociationListener('departure', 'dep-key-r1');

        expect(mockUnsubscribe).toHaveBeenCalled();
      });

      it('calls unsubscribe function for arrival', () => {
        const mockUnsubscribe = jest.fn();
        (onValue as jest.Mock).mockReturnValue(mockUnsubscribe);

        addMovementAssociationListener('arrival', 'arr-key-r1', jest.fn());
        removeMovementAssociationListener('arrival', 'arr-key-r1');

        expect(mockUnsubscribe).toHaveBeenCalled();
      });
    });
  });
});
