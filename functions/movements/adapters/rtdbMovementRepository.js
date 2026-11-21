'use strict';

const { getDatabase } = require('firebase-admin/database');
const { createDatabaseRestClient } = require('./databaseRest');
const { toOrderKey } = require('../domain/orderKey');
const fetchUserInvoiceRecipients = require('../../api/fetchUserInvoiceRecipients');

// Realtime Database implementation of the movement repository port (see
// functions/movements/application/saveMovement.js).
//
// Reads for the server's own checks use the Admin SDK; they never reach the
// caller. Writes, and the movement lists returned to the caller
// (listMovements), go through the REST API as the caller
// (auth_variable_override), so the database rules apply to them exactly as
// they apply to the web client's requests.

const PATHS = Object.freeze({ departure: 'departures', arrival: 'arrivals' });

function pathOf(type) {
  if (!Object.prototype.hasOwnProperty.call(PATHS, type)) {
    throw new TypeError(`Unknown movement type: ${JSON.stringify(type)}`);
  }
  return PATHS[type];
}

/**
 * The `auth` the database rules see for the caller, as the client SDK would
 * present it: the uid (admins are recognised by /admins/<uid>, guest and
 * kiosk by their fixed uids) and the token's e-mail, if any.
 */
function authOverrideFor(actor) {
  const token = typeof actor.email === 'string' && actor.email !== '' ? { email: actor.email } : {};
  return { uid: actor.uid, token };
}

async function readValue(db, path) {
  const snapshot = await db.ref(path).once('value');
  return snapshot.val();
}

const LOGIN_UID_PREFIX = 'login:';
const INVALID_KEY_CHARS = /[.#$[\]/]/;


// The app's Firebase user of a verified e-mail (the app signs pilots in by
// e-mail code, one user per address; functions/auth/verifySignInCode.js),
// or null.
async function appUserUid(auth, email) {
  if (typeof email !== 'string' || email === '') {
    return null;
  }
  try {
    const user = await auth.getUserByEmail(email);
    return user.emailVerified === true && user.disabled !== true ? user.uid : null;
  } catch (error) {
    if (error && error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

// RTDB returns a query result as an object; entries ordered by negative
// timestamp (newest first), the order of the queries below.
const byNewest = (a, b) => (a[1].negativeTimestamp ?? 0) - (b[1].negativeTimestamp ?? 0);

/**
 * db:   () => Admin SDK database (reads);
 * rest: client of databaseRest.js (writes as the caller).
 */
// Loaded on first use: firebase-admin/auth is only needed to list movements
// for callers of the central login.
const defaultAuth = () => require('firebase-admin/auth').getAuth();

const defaultSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function createRtdbMovementRepository({
  db = getDatabase, auth = defaultAuth, rest = createDatabaseRestClient(), sleep = defaultSleep,
} = {}) {
  return {
    /**
     * What decides how the actor may pay an arrival (domain/paymentOptions.js):
     * {invoiceRecipientNames, isHomeBase}: the invoice recipients the actor's
     * e-mail is listed for (as the app's /users/me/invoice-recipients) and
     * whether the aircraft is a club or home-base aircraft (/settings/aircrafts).
     */
    async loadPaymentFacts(actor, arrival) {
      const database = db();
      const [invoiceRecipientNames, club, homeBase] = await Promise.all([
        fetchUserInvoiceRecipients(database, actor.email),
        readValue(database, 'settings/aircrafts/club'),
        readValue(database, 'settings/aircrafts/homeBase'),
      ]);
      const registration = arrival.immatriculation;
      const isHomeBase = typeof registration === 'string'
        && ((club || {})[registration] === true || (homeBase || {})[registration] === true);
      return { invoiceRecipientNames, isHomeBase };
    },

    // push() of an online payment to /card-payments as the actor; the key.
    async createCardPayment(payment, actor) {
      const answer = await rest.write('POST', 'card-payments', payment, authOverrideFor(actor));
      if (!answer || typeof answer.name !== 'string') {
        throw new Error('Database answered a push without the new key');
      }
      return answer.name;
    },

    /**
     * Waits for the payment service's answer to an online payment:
     * {url} (the checkout page), {failed: true}, or {pending: true} after
     * `timeoutMs`.
     */
    async waitForCheckout(paymentId, { timeoutMs = 10000, intervalMs = 500 } = {}) {
      const database = db();
      for (let waited = 0; waited <= timeoutMs; waited += intervalMs) {
        const payment = await readValue(database, `card-payments/${paymentId}`);
        if (payment && typeof payment.data === 'string' && payment.data !== '') {
          return { url: payment.data };
        }
        if (payment && payment.status === 'failure') {
          return { failed: true };
        }
        await sleep(intervalMs);
      }
      return { pending: true };
    },

    /**
     * What decides which movements the actor may list (domain/readAccess.js):
     * {appUid, admin, allMovements}. appUid: the actor's Firebase uid; for a
     * caller of the central login the app user with the same verified
     * e-mail, or null. admin, allMovements: that user's /admins/<uid> and
     * /logins/<uid>/allMovements entries (the rules' CAN_SEE_ALL_MOVEMENTS).
     */
    async loadReaderFacts(actor) {
      const appUid = actor.uid.startsWith(LOGIN_UID_PREFIX) ? await appUserUid(auth(), actor.email) : actor.uid;
      if (!appUid || INVALID_KEY_CHARS.test(appUid)) {
        return { appUid: null, admin: false, allMovements: false };
      }
      const database = db();
      const [admin, allMovements] = await Promise.all([
        readValue(database, `admins/${appUid}`),
        readValue(database, `logins/${appUid}/allMovements`),
      ]);
      return { appUid, admin: admin === true, allMovements: allMovements === true };
    },

    /**
     * Movements of `type` with dateTime in [fromMs, toMs], newest first, at
     * most `limit`; only those created by `owner` unless owner is null.
     * Read as `caller` ({uid, email}, as authOverrideFor presents it to the
     * rules); resolves with [[key, movement]].
     */
    async listMovements(type, { fromMs, toMs, owner, limit }, caller) {
      const query = owner
        ? {
          orderBy: 'createdBy_orderKey',
          startAt: toOrderKey(owner, -toMs),
          endAt: toOrderKey(owner, -fromMs),
          limitToFirst: limit,
        }
        : { orderBy: 'negativeTimestamp', startAt: -toMs, endAt: -fromMs, limitToFirst: limit };
      const answer = await rest.read(pathOf(type), query, authOverrideFor(caller));
      const entries = answer && typeof answer === 'object' ? Object.entries(answer) : [];
      return entries.filter(([, movement]) => movement && typeof movement === 'object').sort(byNewest);
    },

    // The stored movement, or null. `key` must already be a valid key.
    async findMovement(type, key) {
      return readValue(db(), `${pathOf(type)}/${key}`);
    },

    // What the domain needs from /settings for a movement write.
    async loadWriteSettings() {
      const database = db();
      const [lockDate, lockDateIso, customsBaseUrl] = await Promise.all([
        readValue(database, 'settings/lockDate'),
        readValue(database, 'settings/lockDateIso'),
        readValue(database, 'settings/customsDeclarationApp/baseUrl'),
      ]);
      return { lockDate, lockDateIso, customsBaseUrl };
    },

    // push() of the movement as the actor; resolves with the new key.
    async createMovement(type, movement, actor) {
      const answer = await rest.write('POST', pathOf(type), movement, authOverrideFor(actor));
      if (!answer || typeof answer.name !== 'string') {
        throw new Error('Database answered a push without the new key');
      }
      return answer.name;
    },

    // update() of the patch (null removes a field) as the actor.
    async updateMovement(type, key, patch, actor) {
      await rest.write('PATCH', `${pathOf(type)}/${key}`, patch, authOverrideFor(actor));
    },
  };
}

module.exports = { createRtdbMovementRepository, authOverrideFor };
