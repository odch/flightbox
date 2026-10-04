import {call, put, takeEvery, takeLatest, takeLeading, all} from 'redux-saga/effects';
import {runSaga} from 'redux-saga';
import * as actions from './actions';
import * as sagas from './sagas';
import reducer from './reducer';
import {getIdToken} from '../../util/firebase';
import {error as logError} from '../../util/log';

jest.mock('../../util/firebase');
jest.mock('../../util/log');

const URL = 'https://europe-west1-test-project.cloudfunctions.net/api/v1/api-keys';
const ID_TOKEN = 'test-token';
const PLAINTEXT = 'fbx_Ab3dEf6hIj9k_' + 'S'.repeat(43);

const rawKey = {
  id: 'Ab3dEf6hIj9k',
  name: 'Statistikprogramm Hans',
  scopes: ['reports:airstat', 'reports:airstat:internal'],
  createdAt: 1791043200000,
  createdBy: 'admin@example.ch',
  expiresAt: 1822579200000,
  lastUsedAt: null,
};

const payload = {
  name: 'Statistikprogramm Hans',
  scopes: ['reports:airstat'],
  expiresInMonths: 12,
  confirmPersonalData: false,
};

describe('modules', () => {
  describe('apiKeys', () => {
    describe('sagas', () => {
      beforeEach(() => {
        (global as any).__FIREBASE_PROJECT_ID__ = 'test-project';
        global.fetch = jest.fn();
        (logError as jest.Mock).mockClear();
      });

      it('registers the watchers', () => {
        const generator = sagas.default();
        expect(generator.next().value).toEqual(all([
          takeLatest(actions.LOAD_API_KEYS, sagas.loadApiKeys),
          takeLeading(actions.CREATE_API_KEY, sagas.createApiKey),
          takeEvery(actions.REVOKE_API_KEY, sagas.revokeApiKey),
        ]));
      });

      describe('errorCode', () => {
        it('maps HTTP status codes', () => {
          expect(sagas.errorCode(400)).toBe('invalid_request');
          expect(sagas.errorCode(401)).toBe('forbidden');
          expect(sagas.errorCode(403)).toBe('forbidden');
          expect(sagas.errorCode(500)).toBe('failed');
        });
      });

      describe('toApiKey', () => {
        it('keeps only the documented metadata fields', () => {
          expect(sagas.toApiKey({...rawKey, key: PLAINTEXT, hash: 'abc'})).toEqual(rawKey);
        });

        it('normalises missing nullable fields to null', () => {
          const {expiresAt, lastUsedAt, createdBy, ...rest} = rawKey;
          expect(sagas.toApiKey(rest)).toEqual({...rest, createdBy: null, expiresAt: null, lastUsedAt: null});
        });
      });

      describe('loadApiKeys', () => {
        it('loads keys and available scopes', () => {
          const generator = sagas.loadApiKeys();

          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next(ID_TOKEN).value).toEqual(call(fetch, URL, {
            method: 'GET',
            headers: {'Authorization': `Bearer ${ID_TOKEN}`},
          }));

          const response = {ok: true, json: jest.fn()} as any;
          expect(generator.next(response).value).toEqual(call([response, response.json]));

          const body = {availableScopes: ['reports:airstat', 'reports:airstat:internal'], keys: [rawKey]};
          expect(generator.next(body).value).toEqual(
            put(actions.apiKeysLoaded([rawKey], ['reports:airstat', 'reports:airstat:internal']))
          );
          expect(generator.next().done).toBe(true);
        });

        it('puts API_KEYS_LOAD_FAILED without reading the body when the response is not ok', () => {
          const generator = sagas.loadApiKeys();
          generator.next();
          generator.next(ID_TOKEN);

          const response = {ok: false, status: 403, json: jest.fn()};
          expect(generator.next(response).value).toEqual(put(actions.apiKeysLoadFailed('forbidden')));
          expect(generator.next().done).toBe(true);
          expect(response.json).not.toHaveBeenCalled();
          expect((logError as jest.Mock).mock.calls[0][1].message).toContain('HTTP 403');
        });

        it('puts API_KEYS_LOAD_FAILED when fetch throws', () => {
          const generator = sagas.loadApiKeys();
          generator.next();
          expect(generator.throw(new TypeError('Network error')).value).toEqual(
            put(actions.apiKeysLoadFailed('failed'))
          );
          expect(generator.next().done).toBe(true);
        });
      });

      describe('createApiKey', () => {
        it('posts the payload, stores the metadata and hands the key to the callback only', () => {
          const onCreated = jest.fn();
          const action = actions.createApiKey(payload, onCreated);
          const generator = sagas.createApiKey(action);

          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next(ID_TOKEN).value).toEqual(call(fetch, URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ID_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }));

          const response = {ok: true, status: 201, json: jest.fn()} as any;
          expect(generator.next(response).value).toEqual(call([response, response.json]));

          const putEffect = generator.next({key: PLAINTEXT, apiKey: rawKey}).value;
          expect(putEffect).toEqual(put(actions.apiKeyCreated(rawKey)));
          expect(JSON.stringify(putEffect)).not.toContain(PLAINTEXT);

          expect(generator.next().value).toEqual(call(onCreated, PLAINTEXT));
          expect(generator.next(true).done).toBe(true);
        });

        it('revokes the new key when it could not be shown', () => {
          const onCreated = jest.fn();
          const generator = sagas.createApiKey(actions.createApiKey(payload, onCreated));
          generator.next();
          generator.next(ID_TOKEN);
          const response = {ok: true, status: 201, json: jest.fn()} as any;
          generator.next(response);
          generator.next({key: PLAINTEXT, apiKey: rawKey});

          expect(generator.next().value).toEqual(call(onCreated, PLAINTEXT));
          expect(generator.next(false).value).toEqual(put(actions.revokeApiKey(rawKey.id)));
          expect(generator.next().done).toBe(true);
        });

        it('puts CREATE_API_KEY_FAILED with the error code when the response is not ok', () => {
          const onCreated = jest.fn();
          const generator = sagas.createApiKey(actions.createApiKey(payload, onCreated));
          generator.next();
          generator.next(ID_TOKEN);

          const response = {ok: false, status: 400, json: jest.fn()};
          expect(generator.next(response).value).toEqual(put(actions.createApiKeyFailed('invalid_request')));
          expect(generator.next().done).toBe(true);
          expect(response.json).not.toHaveBeenCalled();
          expect(onCreated).not.toHaveBeenCalled();
        });

        it('puts CREATE_API_KEY_FAILED when the response has no key', () => {
          const generator = sagas.createApiKey(actions.createApiKey(payload, jest.fn()));
          generator.next();
          generator.next(ID_TOKEN);
          const response = {ok: true, json: jest.fn()} as any;
          generator.next(response);
          expect(generator.next({apiKey: rawKey}).value).toEqual(put(actions.createApiKeyFailed('failed')));
        });

        it('logs only the error type, never its message (which could quote the body)', () => {
          const generator = sagas.createApiKey(actions.createApiKey(payload, jest.fn()));
          generator.next();
          generator.next(ID_TOKEN);
          generator.next({ok: true, json: jest.fn()} as any);
          expect(generator.throw(new SyntaxError(`Unexpected token in "${PLAINTEXT}"`)).value).toEqual(
            put(actions.createApiKeyFailed('failed'))
          );
          const logged = JSON.stringify((logError as jest.Mock).mock.calls.map(([m, e]) => [m, e.message]));
          expect(logged).toContain('SyntaxError');
          expect(logged).not.toContain(PLAINTEXT);
        });

        it('never dispatches the plaintext key nor stores it (end to end with runSaga)', async () => {
          const dispatched: any[] = [];
          let state = reducer(undefined, {} as any);
          const onCreated = jest.fn(() => true);
          (getIdToken as jest.Mock).mockResolvedValue(ID_TOKEN);
          const fetchMock = jest.fn().mockResolvedValue({
            ok: true,
            status: 201,
            json: () => Promise.resolve({key: PLAINTEXT, apiKey: {...rawKey, key: PLAINTEXT}}),
          });
          const originalFetch = global.fetch;
          global.fetch = fetchMock as any;
          try {
            const action = actions.createApiKey(payload, onCreated);
            dispatched.push(action);
            state = reducer(state, action);
            await runSaga({
              dispatch: (a: any) => {
                dispatched.push(a);
                state = reducer(state, a);
              },
              getState: () => state,
            }, sagas.createApiKey, action).toPromise();
          } finally {
            global.fetch = originalFetch;
          }

          expect(onCreated).toHaveBeenCalledWith(PLAINTEXT);
          expect(dispatched.map(a => a.type)).toEqual([actions.CREATE_API_KEY, actions.API_KEY_CREATED]);
          expect(JSON.stringify(dispatched)).not.toContain(PLAINTEXT);
          expect(JSON.stringify(state)).not.toContain(PLAINTEXT);
          expect(state.keys).toEqual([rawKey]);
        });
      });

      describe('revokeApiKey', () => {
        it('deletes the key and puts API_KEY_REVOKED', () => {
          const generator = sagas.revokeApiKey(actions.revokeApiKey('Ab3dEf6hIj9k'));

          expect(generator.next().value).toEqual(call(getIdToken));
          expect(generator.next(ID_TOKEN).value).toEqual(call(fetch, `${URL}/Ab3dEf6hIj9k`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${ID_TOKEN}`},
          }));
          expect(generator.next({ok: true, status: 204}).value).toEqual(put(actions.apiKeyRevoked('Ab3dEf6hIj9k')));
          expect(generator.next().done).toBe(true);
        });

        it('encodes the id in the URL', () => {
          const generator = sagas.revokeApiKey(actions.revokeApiKey('a/b'));
          generator.next();
          expect((generator.next(ID_TOKEN).value as any).payload.args[0]).toBe(`${URL}/a%2Fb`);
        });

        it('puts REVOKE_API_KEY_FAILED when the response is not ok', () => {
          const generator = sagas.revokeApiKey(actions.revokeApiKey('Ab3dEf6hIj9k'));
          generator.next();
          generator.next(ID_TOKEN);
          expect(generator.next({ok: false, status: 500}).value).toEqual(
            put(actions.revokeApiKeyFailed('Ab3dEf6hIj9k', 'failed'))
          );
          expect(generator.next().done).toBe(true);
        });

        it('puts REVOKE_API_KEY_FAILED when fetch throws', () => {
          const generator = sagas.revokeApiKey(actions.revokeApiKey('Ab3dEf6hIj9k'));
          generator.next();
          expect(generator.throw(new TypeError('Network error')).value).toEqual(
            put(actions.revokeApiKeyFailed('Ab3dEf6hIj9k', 'failed'))
          );
        });
      });
    });
  });
});
