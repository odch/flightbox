export const LOAD_API_KEYS = 'LOAD_API_KEYS' as const;
export const API_KEYS_LOADED = 'API_KEYS_LOADED' as const;
export const API_KEYS_LOAD_FAILED = 'API_KEYS_LOAD_FAILED' as const;
export const CREATE_API_KEY = 'CREATE_API_KEY' as const;
export const API_KEY_CREATED = 'API_KEY_CREATED' as const;
export const CREATE_API_KEY_FAILED = 'CREATE_API_KEY_FAILED' as const;
export const REVOKE_API_KEY = 'REVOKE_API_KEY' as const;
export const API_KEY_REVOKED = 'API_KEY_REVOKED' as const;
export const REVOKE_API_KEY_FAILED = 'REVOKE_API_KEY_FAILED' as const;

// Metadata of an API key as listed by GET /v1/api-keys. The plaintext key
// is never part of it: it is shown once after creation and lives only in
// component state (see CreateApiKeyCallback).
export interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  createdAt: number;
  createdBy: string | null;
  expiresAt: number | null;
  lastUsedAt: number | null;
}

export interface CreateApiKeyPayload {
  name: string;
  scopes: string[];
  expiresInMonths: number | null;
  confirmPersonalData: boolean;
}

// Receives the plaintext key once. The saga calls it directly, so the key
// never travels through a dispatched action or the store (Redux DevTools
// and Sentry record those). Returns whether the key could be shown; it
// cannot when the page was left meanwhile, and then the key is revoked.
export type CreateApiKeyCallback = (key: string) => boolean;

// 'invalid_request' (400), 'forbidden' (401/403) or 'failed' (anything else).
export type ApiKeysErrorCode = 'invalid_request' | 'forbidden' | 'failed';

export type ApiKeysAction =
  | { type: typeof LOAD_API_KEYS }
  | { type: typeof API_KEYS_LOADED; payload: { keys: ApiKey[]; availableScopes: string[] } }
  | { type: typeof API_KEYS_LOAD_FAILED; payload: { error: ApiKeysErrorCode } }
  | { type: typeof CREATE_API_KEY; payload: CreateApiKeyPayload; onCreated: CreateApiKeyCallback }
  | { type: typeof API_KEY_CREATED; payload: { apiKey: ApiKey } }
  | { type: typeof CREATE_API_KEY_FAILED; payload: { error: ApiKeysErrorCode } }
  | { type: typeof REVOKE_API_KEY; payload: { id: string } }
  | { type: typeof API_KEY_REVOKED; payload: { id: string } }
  | { type: typeof REVOKE_API_KEY_FAILED; payload: { id: string; error: ApiKeysErrorCode } };

export function loadApiKeys() {
  return {
    type: LOAD_API_KEYS,
  };
}

export function apiKeysLoaded(keys: ApiKey[], availableScopes: string[]) {
  return {
    type: API_KEYS_LOADED,
    payload: {
      keys,
      availableScopes,
    },
  };
}

export function apiKeysLoadFailed(error: ApiKeysErrorCode) {
  return {
    type: API_KEYS_LOAD_FAILED,
    payload: {
      error,
    },
  };
}

export function createApiKey(payload: CreateApiKeyPayload, onCreated: CreateApiKeyCallback) {
  return {
    type: CREATE_API_KEY,
    payload,
    onCreated,
  };
}

export function apiKeyCreated(apiKey: ApiKey) {
  return {
    type: API_KEY_CREATED,
    payload: {
      apiKey,
    },
  };
}

export function createApiKeyFailed(error: ApiKeysErrorCode) {
  return {
    type: CREATE_API_KEY_FAILED,
    payload: {
      error,
    },
  };
}

export function revokeApiKey(id: string) {
  return {
    type: REVOKE_API_KEY,
    payload: {
      id,
    },
  };
}

export function apiKeyRevoked(id: string) {
  return {
    type: API_KEY_REVOKED,
    payload: {
      id,
    },
  };
}

export function revokeApiKeyFailed(id: string, error: ApiKeysErrorCode) {
  return {
    type: REVOKE_API_KEY_FAILED,
    payload: {
      id,
      error,
    },
  };
}
