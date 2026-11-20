/**
 * Emulator test: movement lists through the app API (GET /app/movements,
 * functions/movements) against the built database rules of lsze.
 *
 * Run via: npm run test:rules  (starts the RTDB emulator, then runs this).
 *
 * The API reads as the caller (REST API with auth_variable_override), so the
 * rules decide as for the web client. This checks, with the real RTDB adapter:
 *  - pilots get their own movements, also with a token of the central login;
 *  - admins and allMovements operators get all, those of others without
 *    personal data; a caller of the central login with the rights of the app
 *    user of the same verified e-mail;
 *  - queries the API would never make for a pilot (unbounded, another
 *    pilot's index), sent straight through the adapter, are denied by the
 *    rules.
 * Only ID token verification and the app user lookup are faked.
 */
'use strict';

const assert = require('assert');
const path = require('path');

const fromFunctions = name => require(require.resolve(name, { paths: [path.join(__dirname, '../../functions')] }));
const express = fromFunctions('express');
const { initializeApp, deleteApp } = fromFunctions('firebase-admin/app');
const { getDatabase } = fromFunctions('firebase-admin/database');

const { emulatorRulesFor } = require('./emulatorRules');
const { loadVariant } = require('../../functions/movements/domain/testing/projectPolicies');
const { stored } = require('../../functions/movements/domain/testing/movementCases');
const { toOrderKey } = require('../../functions/movements/domain/orderKey');
const { registerMovementRoutes } = require('../../functions/movements');
const { listMovements } = require('../../functions/movements/application/listMovements');
const { loginActor } = require('../../functions/api/http/appAuth');
const { createRtdbMovementRepository } = require('../../functions/movements/adapters/rtdbMovementRepository');
const { RulesRejectedError, createDatabaseRestClient } = require('../../functions/movements/adapters/databaseRest');
const { listen } = require('../../functions/api/http/testing/listen');

const NAMESPACE = 'demo-movement-api';
const EMULATOR_HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST;

const EMAILS = {
  'pilot-uid': 'pilot@example.com',
  'other-uid': 'other@example.com',
  'admin-uid': 'admin@example.com',
  'op-uid': 'op@example.com',
};
// The app's Firebase users by e-mail (the lookup for callers of the central login).
const APP_USERS = {
  'pilot@example.com': { uid: 'pilot-uid', emailVerified: true },
  'admin@example.com': { uid: 'admin-uid', emailVerified: true },
  'unverified-admin@example.com': { uid: 'admin-uid', emailVerified: false },
};

const fakeAuth = () => ({
  verifyIdToken: async token => {
    const uid = token.replace(/^token-/, '');
    return EMAILS[uid] ? { uid, email: EMAILS[uid] } : { uid };
  },
  getUserByEmail: async email => {
    if (!APP_USERS[email]) {
      throw Object.assign(new Error('no user'), { code: 'auth/user-not-found' });
    }
    return { disabled: false, ...APP_USERS[email] };
  },
});

let failures = 0;
async function check(label, test) {
  try {
    await test();
    console.log(`  ✓ ${label}`);
  } catch (e) {
    failures++;
    console.error(`  ✗ ${label} — ${e.message}`);
  }
}

async function rejectedByRules(promise) {
  const error = await promise.then(() => null, e => e);
  assert.ok(error instanceof RulesRejectedError, `expected a rules rejection, got ${error ? error.stack : 'success'}`);
}

async function loadRules(rulesConfig) {
  const response = await fetch(`http://${EMULATOR_HOST}/.settings/rules.json?ns=${NAMESPACE}`, {
    method: 'PUT',
    headers: { Authorization: 'Bearer owner' },
    body: emulatorRulesFor(rulesConfig),
  });
  assert.strictEqual(response.status, 200, `loading the rules failed: ${await response.text()}`);
}

const FROM = '2026-11-20T00:00:00.000Z';
const TO = '2026-11-20T23:59:59.999Z';

async function main() {
  assert.ok(EMULATOR_HOST, 'FIREBASE_DATABASE_EMULATOR_HOST is not set; run via npm run test:rules');
  const credential = { getAccessToken: async () => ({ access_token: 'owner', expires_in: 3600 }) };
  const app = initializeApp({
    projectId: NAMESPACE,
    databaseURL: `https://${NAMESPACE}.firebaseio.com`,
    credential,
  }, 'movement-api-read');
  const db = getDatabase(app);
  const { rulesConfig, serverConfig, policy } = loadVariant('lsze');
  await loadRules(rulesConfig);

  // A stored movement at `iso`, created by `createdBy`, with personal data.
  const movement = (type, createdBy, iso) => {
    const negativeTimestamp = -Date.parse(iso);
    return {
      ...stored(type, policy, {}),
      dateTime: iso,
      negativeTimestamp,
      createdBy,
      createdBy_orderKey: toOrderKey(createdBy, negativeTimestamp),
      firstname: 'Erika',
      lastname: 'Beispiel',
      email: createdBy,
      phone: '+41 79 000 00 00',
      remarks: 'Notiz-7Q3',
    };
  };
  await db.ref().set(null);
  await db.ref('admins').set({ 'admin-uid': true });
  await db.ref('logins/op-uid').set({ allMovements: true });
  await db.ref('departures').set({
    pilotDep: movement('departure', 'pilot@example.com', '2026-11-20T14:30:00.000Z'),
    otherDep: movement('departure', 'other@example.com', '2026-11-20T11:00:00.000Z'),
    pilotOld: movement('departure', 'pilot@example.com', '2026-11-18T09:00:00.000Z'),
  });
  await db.ref('arrivals').set({
    pilotArr: movement('arrival', 'pilot@example.com', '2026-11-20T09:15:00.000Z'),
  });

  const repository = createRtdbMovementRepository({
    db: () => db,
    auth: fakeAuth,
    rest: createDatabaseRestClient({ app: () => app }),
  });
  const api = express();
  registerMovementRoutes(api, serverConfig, { auth: fakeAuth, db: () => db, repository });
  const server = await listen(api);
  const get = async (uid) => {
    const response = await server.request(`/api/app/movements?from=${FROM}&to=${TO}`, {
      headers: { Authorization: `Bearer token-${uid}` },
    });
    const body = await response.json();
    assert.strictEqual(response.status, 200, `${response.status} ${JSON.stringify(body)}`);
    return body.movements;
  };
  const listFor = actor => listMovements({ repository, policy, actor, fromMs: Date.parse(FROM), toMs: Date.parse(TO) })
    .then(result => result.movements);
  const keys = movements => movements.map(m => m.key);
  const login = (sub, email) => loginActor({ sub, email, scopes: ['movements:read'] });

  console.log('movement API lists (rules of lsze, as the caller)');

  await check('a pilot gets the own movements of the period, with all fields', async () => {
    const movements = await get('pilot-uid');
    assert.deepStrictEqual(keys(movements), ['pilotArr', 'pilotDep']);
    assert.ok(movements.every(m => m.own && m.firstname === 'Erika'));
  });

  await check('so does a pilot with a token of the central login', async () => {
    assert.deepStrictEqual(keys(await listFor(login('sub-1', 'pilot@example.com'))), ['pilotArr', 'pilotDep']);
  });

  await check('an admin gets all, those of others without personal data', async () => {
    const movements = await get('admin-uid');
    assert.deepStrictEqual(keys(movements), ['pilotArr', 'otherDep', 'pilotDep']);
    const text = JSON.stringify(movements);
    ['Erika', 'Beispiel', '@example.com', '+41', 'Notiz-7Q3'].forEach(personal => assert.ok(!text.includes(personal), personal));
    assert.ok(movements.every(m => !m.own && m.immatriculation));
  });

  await check('so does an allMovements operator', async () => {
    assert.deepStrictEqual(keys(await get('op-uid')), ['pilotArr', 'otherDep', 'pilotDep']);
  });

  await check('a caller of the central login has the rights of the app user of the e-mail', async () => {
    assert.deepStrictEqual(keys(await listFor(login('sub-2', 'admin@example.com'))), ['pilotArr', 'otherDep', 'pilotDep']);
    assert.deepStrictEqual(keys(await listFor(login('sub-3', 'unverified-admin@example.com'))), []);
    assert.deepStrictEqual(keys(await listFor(login('sub-4', 'nobody@example.com'))), []);
  });

  await check('the rules deny an unbounded query to a pilot', async () => {
    const rest = createDatabaseRestClient({ app: () => app });
    await rejectedByRules(rest.read('departures', { orderBy: 'negativeTimestamp', startAt: -Date.parse(TO), endAt: -Date.parse(FROM) },
      { uid: 'login:sub-1', token: { email: 'pilot@example.com' } }));
  });

  await check('the rules deny a pilot the index of another pilot', async () => {
    const rest = createDatabaseRestClient({ app: () => app });
    await rejectedByRules(rest.read('departures', {
      orderBy: 'createdBy_orderKey',
      startAt: toOrderKey('other@example.com', -Date.parse(TO)),
      endAt: toOrderKey('other@example.com', -Date.parse(FROM)),
    }, { uid: 'login:sub-1', token: { email: 'pilot@example.com' } }));
  });

  await server.close();
  await deleteApp(app);
}

main().then(() => {
  if (failures > 0) {
    console.error(`\n${failures} movement API list assertion(s) failed`);
    process.exit(1);
  }
  console.log('\nAll movement API list assertions passed');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
