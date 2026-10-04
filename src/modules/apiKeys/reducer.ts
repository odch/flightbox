import * as actions from './actions';
import {ApiKey, ApiKeysAction, ApiKeysErrorCode} from './actions';
import reducer from '../../util/reducer';

type ActionOf<T extends ApiKeysAction['type']> = Extract<ApiKeysAction, { type: T }>;

interface ApiKeysState {
  keys: ApiKey[] | undefined;
  availableScopes: string[];
  loadError: ApiKeysErrorCode | null;
  creating: boolean;
  createError: ApiKeysErrorCode | null;
  revoking: string[];
  revokeError: ApiKeysErrorCode | null;
}

const INITIAL_STATE: ApiKeysState = {
  keys: undefined,
  availableScopes: [],
  loadError: null,
  creating: false,
  createError: null,
  revoking: [],
  revokeError: null,
};

// Dispatched when the page is opened (and on retry): errors of an earlier
// visit are not shown again.
const loadApiKeys = (state: ApiKeysState): ApiKeysState => ({
  ...state,
  loadError: null,
  createError: null,
  revokeError: null,
});

const apiKeysLoaded = (state: ApiKeysState, action: ActionOf<typeof actions.API_KEYS_LOADED>): ApiKeysState => ({
  ...state,
  keys: action.payload.keys,
  availableScopes: action.payload.availableScopes,
  loadError: null,
});

const apiKeysLoadFailed = (state: ApiKeysState, action: ActionOf<typeof actions.API_KEYS_LOAD_FAILED>): ApiKeysState => ({
  ...state,
  loadError: action.payload.error,
});

// The CREATE_API_KEY action carries a callback; nothing of it is stored.
const createApiKey = (state: ApiKeysState): ApiKeysState => ({
  ...state,
  creating: true,
  createError: null,
});

const apiKeyCreated = (state: ApiKeysState, action: ActionOf<typeof actions.API_KEY_CREATED>): ApiKeysState => {
  const {apiKey} = action.payload;
  const others = (state.keys || []).filter(key => key.id !== apiKey.id);
  return {
    ...state,
    keys: [apiKey, ...others],
    creating: false,
    createError: null,
  };
};

const createApiKeyFailed = (state: ApiKeysState, action: ActionOf<typeof actions.CREATE_API_KEY_FAILED>): ApiKeysState => ({
  ...state,
  creating: false,
  createError: action.payload.error,
});

const revokeApiKey = (state: ApiKeysState, action: ActionOf<typeof actions.REVOKE_API_KEY>): ApiKeysState => ({
  ...state,
  revoking: state.revoking.includes(action.payload.id)
    ? state.revoking
    : [...state.revoking, action.payload.id],
  revokeError: null,
});

const apiKeyRevoked = (state: ApiKeysState, action: ActionOf<typeof actions.API_KEY_REVOKED>): ApiKeysState => ({
  ...state,
  keys: state.keys ? state.keys.filter(key => key.id !== action.payload.id) : state.keys,
  revoking: state.revoking.filter(id => id !== action.payload.id),
});

const revokeApiKeyFailed = (state: ApiKeysState, action: ActionOf<typeof actions.REVOKE_API_KEY_FAILED>): ApiKeysState => ({
  ...state,
  revoking: state.revoking.filter(id => id !== action.payload.id),
  revokeError: action.payload.error,
});

const ACTION_HANDLERS = {
  [actions.LOAD_API_KEYS]: loadApiKeys,
  [actions.API_KEYS_LOADED]: apiKeysLoaded,
  [actions.API_KEYS_LOAD_FAILED]: apiKeysLoadFailed,
  [actions.CREATE_API_KEY]: createApiKey,
  [actions.API_KEY_CREATED]: apiKeyCreated,
  [actions.CREATE_API_KEY_FAILED]: createApiKeyFailed,
  [actions.REVOKE_API_KEY]: revokeApiKey,
  [actions.API_KEY_REVOKED]: apiKeyRevoked,
  [actions.REVOKE_API_KEY_FAILED]: revokeApiKeyFailed,
};

export type {ApiKeysState};
export default reducer<ApiKeysState, ApiKeysAction>(INITIAL_STATE, ACTION_HANDLERS);
