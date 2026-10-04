import reducer, {ApiKeysState} from './reducer';
import * as actions from './actions';
import {ApiKey} from './actions';

const INITIAL_STATE: ApiKeysState = {
  keys: undefined,
  availableScopes: [],
  loadError: null,
  creating: false,
  createError: null,
  revoking: [],
  revokeError: null,
};

const key = (id: string, overrides: Partial<ApiKey> = {}): ApiKey => ({
  id,
  name: `Key ${id}`,
  scopes: ['reports:airstat'],
  createdAt: 1791043200000,
  createdBy: 'admin@example.ch',
  expiresAt: null,
  lastUsedAt: null,
  ...overrides,
});

describe('modules', () => {
  describe('apiKeys', () => {
    describe('reducer', () => {
      it('should handle initial state', () => {
        expect(reducer(undefined, {} as any)).toEqual(INITIAL_STATE);
      });

      describe('LOAD_API_KEYS', () => {
        it('clears the errors of an earlier visit and keeps the loaded keys', () => {
          const state: ApiKeysState = {
            ...INITIAL_STATE,
            keys: [key('a')],
            loadError: 'failed',
            createError: 'invalid_request',
            revokeError: 'failed',
          };
          expect(reducer(state, actions.loadApiKeys())).toEqual({
            ...INITIAL_STATE,
            keys: [key('a')],
          });
        });
      });

      describe('API_KEYS_LOADED', () => {
        it('sets keys and available scopes', () => {
          const keys = [key('a'), key('b')];
          const scopes = ['reports:airstat', 'reports:airstat:internal'];
          expect(reducer({...INITIAL_STATE, loadError: 'failed'}, actions.apiKeysLoaded(keys, scopes))).toEqual({
            ...INITIAL_STATE,
            keys,
            availableScopes: scopes,
          });
        });

        it('replaces existing keys', () => {
          const state = {...INITIAL_STATE, keys: [key('old')]};
          expect(reducer(state, actions.apiKeysLoaded([], [])).keys).toEqual([]);
        });
      });

      describe('API_KEYS_LOAD_FAILED', () => {
        it('stores the error', () => {
          expect(reducer(INITIAL_STATE, actions.apiKeysLoadFailed('forbidden'))).toEqual({
            ...INITIAL_STATE,
            loadError: 'forbidden',
          });
        });
      });

      describe('CREATE_API_KEY', () => {
        it('sets creating, clears the create error and stores nothing of the callback', () => {
          const state = reducer(
            {...INITIAL_STATE, createError: 'failed'},
            actions.createApiKey({name: 'X', scopes: ['reports:airstat'], expiresInMonths: 12, confirmPersonalData: false}, jest.fn())
          );
          expect(state).toEqual({...INITIAL_STATE, creating: true, createError: null});
        });
      });

      describe('API_KEY_CREATED', () => {
        it('prepends the new key (newest first)', () => {
          const state = {...INITIAL_STATE, keys: [key('a')], creating: true};
          expect(reducer(state, actions.apiKeyCreated(key('b')))).toEqual({
            ...INITIAL_STATE,
            keys: [key('b'), key('a')],
          });
        });

        it('creates the list when keys were not loaded', () => {
          expect(reducer(INITIAL_STATE, actions.apiKeyCreated(key('b'))).keys).toEqual([key('b')]);
        });

        it('does not duplicate a key with the same id', () => {
          const state = {...INITIAL_STATE, keys: [key('b', {name: 'old'})]};
          expect(reducer(state, actions.apiKeyCreated(key('b'))).keys).toEqual([key('b')]);
        });
      });

      describe('CREATE_API_KEY_FAILED', () => {
        it('stores the error', () => {
          expect(reducer({...INITIAL_STATE, creating: true}, actions.createApiKeyFailed('invalid_request'))).toEqual({
            ...INITIAL_STATE,
            createError: 'invalid_request',
          });
        });
      });

      describe('REVOKE_API_KEY', () => {
        it('marks the key as revoking and clears the revoke error', () => {
          const state = {...INITIAL_STATE, keys: [key('a')], revokeError: 'failed' as const};
          expect(reducer(state, actions.revokeApiKey('a'))).toEqual({
            ...INITIAL_STATE,
            keys: [key('a')],
            revoking: ['a'],
          });
        });

        it('does not add the same id twice', () => {
          const state = {...INITIAL_STATE, revoking: ['a']};
          expect(reducer(state, actions.revokeApiKey('a')).revoking).toEqual(['a']);
        });
      });

      describe('API_KEY_REVOKED', () => {
        it('removes the key from the list', () => {
          const state = {...INITIAL_STATE, keys: [key('a'), key('b')], revoking: ['a']};
          expect(reducer(state, actions.apiKeyRevoked('a'))).toEqual({
            ...INITIAL_STATE,
            keys: [key('b')],
          });
        });

        it('keeps keys undefined when they were not loaded', () => {
          expect(reducer({...INITIAL_STATE, revoking: ['a']}, actions.apiKeyRevoked('a')).keys).toBeUndefined();
        });
      });

      describe('REVOKE_API_KEY_FAILED', () => {
        it('keeps the key and stores the error', () => {
          const state = {...INITIAL_STATE, keys: [key('a')], revoking: ['a']};
          expect(reducer(state, actions.revokeApiKeyFailed('a', 'failed'))).toEqual({
            ...INITIAL_STATE,
            keys: [key('a')],
            revokeError: 'failed',
          });
        });
      });
    });
  });
});
