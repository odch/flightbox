'use strict';

const { getApp } = require('firebase-admin/app');

// Writes to the Realtime Database through its REST API on behalf of a caller:
// every request carries `auth_variable_override`, so the database evaluates
// its security rules with `auth` set to that override (uid, token.email)
// instead of letting the service account bypass them. The rules thereby stay
// a second line of defence behind the movement domain.
//
// Why REST and not the Admin SDK with databaseAuthVariableOverride: that
// option is per Firebase app, so each caller identity would need its own app
// with its own persistent connection. A REST request is stateless and costs
// one HTTPS round trip.

const REQUEST_TIMEOUT_MS = 15000;
// Renew the access token this long before it expires.
const TOKEN_RENEWAL_MARGIN_MS = 5 * 60 * 1000;
// The database emulator accepts this token as the admin (like the Admin SDK
// does when FIREBASE_DATABASE_EMULATOR_HOST is set).
const EMULATOR_TOKEN = 'owner';

// The database denied the request: its rules (`.read`, `.write` or
// `.validate`) do not allow it for the caller the request was made for.
class RulesRejectedError extends Error {
  constructor(path, operation = 'write') {
    super(`Database rules rejected the ${operation} of ${path}`);
    this.name = 'RulesRejectedError';
    this.path = path;
  }
}

// Any other failure of a REST request (network, timeout, credentials,
// database errors). The message never contains the access token.
class DatabaseRestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'DatabaseRestError';
    if (status !== undefined) {
      this.status = status;
    }
  }
}

// Same as firebase-admin: the `ns` parameter, else the host's first label.
function namespaceOf(url) {
  return url.searchParams.get('ns') || url.hostname.split('.')[0].toLowerCase();
}

/**
 * Where REST requests go: {origin, namespace|null, emulator}. With
 * FIREBASE_DATABASE_EMULATOR_HOST set (functions emulator, specs) requests go
 * to the emulator, with the namespace of the configured database URL.
 */
function resolveTarget(databaseURL, env) {
  if (typeof databaseURL !== 'string' || databaseURL === '') {
    throw new DatabaseRestError('No databaseURL configured for the Firebase app');
  }
  const url = new URL(databaseURL);
  const emulatorHost = env.FIREBASE_DATABASE_EMULATOR_HOST;
  if (emulatorHost) {
    return { origin: `http://${emulatorHost}`, namespace: namespaceOf(url), emulator: true };
  }
  return { origin: url.origin, namespace: url.searchParams.get('ns'), emulator: false };
}

// Guards the override: it must name a caller. Without one, the request
// would run with the service account's unrestricted access.
function assertAuthOverride(authOverride) {
  const isValid = authOverride !== null
    && typeof authOverride === 'object'
    && typeof authOverride.uid === 'string'
    && authOverride.uid !== '';
  if (!isValid) {
    throw new TypeError('A request on behalf of a caller needs an auth override with a uid');
  }
}

function accessTokenSource({ app, now }) {
  let cached = null;
  return async () => {
    if (cached && cached.expiresAt - TOKEN_RENEWAL_MARGIN_MS > now()) {
      return cached.token;
    }
    const { credential } = app().options;
    if (!credential || typeof credential.getAccessToken !== 'function') {
      throw new DatabaseRestError('The Firebase app has no credential');
    }
    const result = await credential.getAccessToken();
    cached = { token: result.access_token, expiresAt: now() + result.expires_in * 1000 };
    return cached.token;
  };
}

function requestUrl(target, path, params) {
  const segments = path.split('/').map(encodeURIComponent).join('/');
  const query = new URLSearchParams(params);
  if (target.namespace) {
    query.set('ns', target.namespace);
  }
  return `${target.origin}/${segments}.json?${query}`;
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text === '' ? null : JSON.parse(text);
  } catch (e) {
    return null;
  }
}

// A rules denial is `401 {"error": "Permission denied"}`; other 401s mean
// the access token was not accepted.
const isPermissionDenied = (status, body) =>
  status === 401
  && body !== null
  && typeof body === 'object'
  && typeof body.error === 'string'
  && /permission denied/i.test(body.error);

/**
 * Creates a REST client. Its `write(method, path, body, authOverride)` sends
 * POST (push), PATCH (update) or PUT (set) for `path` (no leading slash) as
 * the caller described by authOverride ({uid, token: {email?}}), and resolves
 * with the parsed answer (`{name}` for POST, null for PATCH, which is sent
 * with print=silent). It rejects with RulesRejectedError when the rules deny
 * the write and with DatabaseRestError for every other failure.
 */
function createDatabaseRestClient({
  app = getApp,
  env = process.env,
  fetchImpl = (...args) => fetch(...args),
  now = Date.now,
  timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  const serviceAccountToken = accessTokenSource({ app, now });
  let target;
  const resolve = () => {
    if (!target) {
      target = resolveTarget(app().options.databaseURL, env);
    }
    return target;
  };

  async function write(method, path, body, authOverride) {
    assertAuthOverride(authOverride);
    const destination = resolve();
    const token = destination.emulator ? EMULATOR_TOKEN : await serviceAccountToken();
    const params = { auth_variable_override: JSON.stringify(authOverride) };
    if (method === 'PATCH') {
      params.print = 'silent';
    }
    let response;
    try {
      response = await fetchImpl(requestUrl(destination, path, params), {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      throw new DatabaseRestError(`Database ${method} ${path} failed: ${e.name}: ${e.message}`);
    }
    const answer = await readJson(response);
    if (response.ok) {
      return answer;
    }
    if (isPermissionDenied(response.status, answer)) {
      throw new RulesRejectedError(path);
    }
    throw new DatabaseRestError(`Database ${method} ${path} answered ${response.status}`, response.status);
  }

  /**
   * GET of `path` as the caller, with a query (`orderBy`, `startAt`,
   * `endAt`, `limitToFirst`; values are JSON-encoded as the REST API
   * expects). Resolves with the parsed value (null when there is none).
   */
  async function read(path, query, authOverride) {
    assertAuthOverride(authOverride);
    const destination = resolve();
    const token = destination.emulator ? EMULATOR_TOKEN : await serviceAccountToken();
    const params = { auth_variable_override: JSON.stringify(authOverride) };
    Object.entries(query || {}).forEach(([name, value]) => {
      params[name] = JSON.stringify(value);
    });
    let response;
    try {
      response = await fetchImpl(requestUrl(destination, path, params), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e) {
      throw new DatabaseRestError(`Database GET ${path} failed: ${e.name}: ${e.message}`);
    }
    const answer = await readJson(response);
    if (response.ok) {
      return answer;
    }
    if (isPermissionDenied(response.status, answer)) {
      throw new RulesRejectedError(path, 'read');
    }
    throw new DatabaseRestError(`Database GET ${path} answered ${response.status}`, response.status);
  }

  return { write, read };
}

module.exports = {
  createDatabaseRestClient,
  resolveTarget,
  RulesRejectedError,
  DatabaseRestError,
};
