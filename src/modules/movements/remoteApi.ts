import {getIdToken} from '../../util/firebase';

// Movement writes through the app API of the Cloud Functions (flag
// movementWritesViaApi): POST /api/app/movements/<type> creates, PATCH
// /api/app/movements/<type>/<key> updates (merged like RTDB update()).
// Server side see functions/movements/http/movementRoutes.js.

export interface ValidationError {
  field: string;
  reason: string;
}

interface MovementApiErrorDetails {
  status: number;
  code: string;
  reason?: string | null;
  validationErrors?: ValidationError[];
}

// What the sagas' saveMovementFailed path receives. `message` is shown in
// the commit failure dialog; it never contains movement values (PII).
// `status` is 0 when no HTTP response arrived (network failure, no token).
export class MovementApiError extends Error {
  status: number;
  code: string;
  reason: string | null;
  validationErrors: ValidationError[];

  constructor(message: string, {status, code, reason = null, validationErrors = []}: MovementApiErrorDetails) {
    super(message);
    this.name = 'MovementApiError';
    this.status = status;
    this.code = code;
    this.reason = reason;
    this.validationErrors = validationErrors;
  }
}

const MOVEMENT_TYPES = ['departures', 'arrivals'];

// At most this many fields are named in the message, to keep the dialog short.
const MAX_FIELDS_IN_MESSAGE = 5;

// The api function is called on its own host, like the app's other API calls:
// the webpack dev server has no proxy for /api, so a same-origin /api URL
// only works behind Firebase Hosting. The function answers CORS requests
// from any origin (functions/api/index.js).
export const movementsApiUrl = (type: string, key?: string | null) => {
  const base = `https://europe-west1-${__FIREBASE_PROJECT_ID__}.cloudfunctions.net/api/app/movements/${type}`;
  return key ? `${base}/${encodeURIComponent(key)}` : base;
};

// remote.saveMovement gets the database path ('/departures', '/arrivals').
function movementTypeOf(path: string): string {
  const type = path.replace(/^\/+/, '');
  if (!MOVEMENT_TYPES.includes(type)) {
    throw new Error(`Unknown movement path: ${path}`);
  }
  return type;
}

const isObject = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function toValidationErrors(value: unknown): ValidationError[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(isObject)
    .map(entry => ({field: String(entry.field), reason: String(entry.reason)}));
}

function messageOf(message: string, validationErrors: ValidationError[]): string {
  if (validationErrors.length === 0) {
    return message;
  }
  const fields = Array.from(new Set(validationErrors.map(error => error.field)));
  const shown = fields.slice(0, MAX_FIELDS_IN_MESSAGE).join(', ');
  const more = fields.length > MAX_FIELDS_IN_MESSAGE ? ', ...' : '';
  return `${message}: ${shown}${more}`;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
}

// The envelope of functions/api/http/errors.js:
// {error: {code, message, details?: {reason?, validationErrors?}}}. Anything
// else (an HTML page of a proxy, a route that does not exist) is reported
// with its HTTP status only.
function errorFromResponse(status: number, body: unknown): MovementApiError {
  const error = isObject(body) && isObject(body.error) ? body.error : null;
  if (!error || typeof error.code !== 'string') {
    return new MovementApiError(`Request failed (HTTP ${status})`, {status, code: 'unknown'});
  }
  const details = isObject(error.details) ? error.details : {};
  const validationErrors = toValidationErrors(details.validationErrors);
  const message = typeof error.message === 'string' && error.message
    ? error.message
    : `Request failed (HTTP ${status})`;
  return new MovementApiError(messageOf(message, validationErrors), {
    status,
    code: error.code,
    reason: typeof details.reason === 'string' ? details.reason : null,
    validationErrors,
  });
}

// fetch also rejects when the connection drops after the request reached
// the function, so the movement may have been saved; the message must not
// claim otherwise (a create is not idempotent, saving again duplicates it).
const networkError = () => new MovementApiError(
  'Network error: it is unknown whether the movement was saved, check the list before saving again',
  {status: 0, code: 'unavailable', reason: 'network-error'}
);

// getIdToken() throws a TypeError when nobody is signed in (no currentUser)
// and refreshes an expired token over the network, which fails offline with
// auth/network-request-failed. Nothing has been sent in either case.
function idTokenError(e: unknown): MovementApiError {
  const code = isObject(e) && typeof e.code === 'string' ? e.code : null;
  if (code === 'auth/network-request-failed') {
    return new MovementApiError('Network error: the movement could not be sent', {
      status: 0,
      code: 'unavailable',
      reason: 'network-error',
    });
  }
  if (code) {
    return new MovementApiError('Could not verify the sign-in', {status: 0, code: 'unauthenticated', reason: 'id-token-failed'});
  }
  return new MovementApiError('Not signed in', {status: 0, code: 'unauthenticated', reason: 'no-id-token'});
}

async function idToken(): Promise<string> {
  try {
    return await getIdToken();
  } catch (e) {
    throw idTokenError(e);
  }
}

async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    throw networkError();
  }
}

// Writes that have been started and not settled yet. A checkout redirect
// waits for them (see ui/arrivalPayment), otherwise leaving the page could
// cancel the payment method write before it is sent.
const pendingWrites = new Set<Promise<unknown>>();

export const hasPendingMovementWrites = () => pendingWrites.size > 0;

/**
 * Resolves once every movement write started so far has settled
 * (successfully or not). Never rejects.
 */
export function movementWritesSettled(): Promise<void> {
  return Promise.all(Array.from(pendingWrites, write => write.catch(() => undefined)))
    .then(() => undefined);
}

/**
 * Creates (no key) or updates (key) a movement through the app API and
 * resolves to its key, like remote.saveMovement does with the database.
 * Rejects with a MovementApiError. Unlike a database write, nothing is
 * queued while offline and nothing is retried: the request fails right away.
 */
export function saveMovementViaApi(
  path: string,
  key: string | null | undefined,
  movement: Record<string, unknown>
): Promise<string> {
  const write = sendMovement(path, key, movement);
  pendingWrites.add(write);
  const forget = () => {
    pendingWrites.delete(write);
  };
  write.then(forget, forget);
  return write;
}

async function sendMovement(
  path: string,
  key: string | null | undefined,
  movement: Record<string, unknown>
): Promise<string> {
  const type = movementTypeOf(path);
  const token = await idToken();
  const response = await send(movementsApiUrl(type, key), {
    method: key ? 'PATCH' : 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(movement),
  });

  const body = await readJson(response);
  if (!response.ok) {
    throw errorFromResponse(response.status, body);
  }
  if (!isObject(body) || typeof body.key !== 'string' || body.key === '') {
    throw new MovementApiError(`Unexpected response (HTTP ${response.status})`, {
      status: response.status,
      code: 'internal',
      reason: 'invalid-response',
    });
  }
  return body.key;
}
