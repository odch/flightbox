import * as actions from './actions';
import {ApiKey, ApiKeysErrorCode} from './actions';
import {all, call, put, takeEvery, takeLatest, takeLeading} from 'redux-saga/effects';
import {getIdToken} from '../../util/firebase';
import {error as logError} from '../../util/log';

export const apiKeysUrl = () =>
  `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/api/v1/api-keys`;

export const errorCode = (status: number): ApiKeysErrorCode => {
  if (status === 400) {
    return 'invalid_request';
  }
  if (status === 401 || status === 403) {
    return 'forbidden';
  }
  return 'failed';
};

// Logs the HTTP status or the error type only: never a response body nor an
// error message, which for a JSON parse error could quote the body (and with
// it a plaintext key).
const logFailure = (message: string, cause: number | unknown) => {
  const detail = typeof cause === 'number'
    ? `HTTP ${cause}`
    : (cause instanceof Error ? cause.name : 'unknown error');
  logError(message, new Error(`${message} (${detail})`));
};

const nullableNumber = (value: unknown): number | null =>
  typeof value === 'number' ? value : null;

// Copies only the documented metadata fields, so nothing else the server
// might add to a key object (a secret above all) ends up in the store.
export const toApiKey = (raw: any): ApiKey => ({
  id: String(raw.id),
  name: String(raw.name),
  scopes: Array.isArray(raw.scopes) ? raw.scopes.map(String) : [],
  createdAt: Number(raw.createdAt),
  createdBy: typeof raw.createdBy === 'string' ? raw.createdBy : null,
  expiresAt: nullableNumber(raw.expiresAt),
  lastUsedAt: nullableNumber(raw.lastUsedAt),
});

export function* loadApiKeys() {
  try {
    const idToken = yield call(getIdToken);
    const response = yield call(fetch, apiKeysUrl(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!response.ok) {
      logFailure('Failed to load API keys', response.status);
      yield put(actions.apiKeysLoadFailed(errorCode(response.status)));
      return;
    }

    const body = yield call([response, response.json]);
    const keys = Array.isArray(body.keys) ? body.keys.map(toApiKey) : [];
    const availableScopes = Array.isArray(body.availableScopes) ? body.availableScopes.map(String) : [];

    yield put(actions.apiKeysLoaded(keys, availableScopes));
  } catch (e) {
    logFailure('Failed to load API keys', e);
    yield put(actions.apiKeysLoadFailed('failed'));
  }
}

// The plaintext key of the response is handed to the action's callback only.
// It is never put into an action or the store: API_KEY_CREATED carries the
// metadata (see toApiKey).
export function* createApiKey(action: ReturnType<typeof actions.createApiKey>) {
  try {
    const idToken = yield call(getIdToken);
    const response = yield call(fetch, apiKeysUrl(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action.payload),
    });

    if (!response.ok) {
      logFailure('Failed to create API key', response.status);
      yield put(actions.createApiKeyFailed(errorCode(response.status)));
      return;
    }

    const body = yield call([response, response.json]);
    if (!body || typeof body.key !== 'string' || !body.apiKey) {
      throw new Error('Unexpected response');
    }

    const apiKey = toApiKey(body.apiKey);
    yield put(actions.apiKeyCreated(apiKey));
    const shown = yield call(action.onCreated, body.key);
    if (shown === false) {
      // Nobody has seen the key, so nobody can use it: no unknown keys.
      yield put(actions.revokeApiKey(apiKey.id));
    }
  } catch (e) {
    logFailure('Failed to create API key', e);
    yield put(actions.createApiKeyFailed('failed'));
  }
}

export function* revokeApiKey(action: ReturnType<typeof actions.revokeApiKey>) {
  const {id} = action.payload;
  try {
    const idToken = yield call(getIdToken);
    const response = yield call(fetch, `${apiKeysUrl()}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    });

    if (!response.ok) {
      logFailure('Failed to revoke API key', response.status);
      yield put(actions.revokeApiKeyFailed(id, errorCode(response.status)));
      return;
    }

    yield put(actions.apiKeyRevoked(id));
  } catch (e) {
    logFailure('Failed to revoke API key', e);
    yield put(actions.revokeApiKeyFailed(id, 'failed'));
  }
}

export default function* sagas() {
  yield all([
    takeLatest(actions.LOAD_API_KEYS, loadApiKeys),
    // takeLeading: a double submit must not create two keys.
    takeLeading(actions.CREATE_API_KEY, createApiKey),
    takeEvery(actions.REVOKE_API_KEY, revokeApiKey),
  ]);
}
