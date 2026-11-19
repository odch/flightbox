/**
 * Emulator test: movement writes through the app API (functions/movements)
 * against the built database rules of lsze.
 *
 * Run via: npm run test:rules  (starts the RTDB emulator, then runs this).
 *
 * The API writes as the caller (REST API with auth_variable_override), so
 * the rules still apply. This checks, with the real RTDB adapter:
 *  - the routes store what the web client stores today, for pilots, guest,
 *    kiosk and admins (the rules accept the API's writes);
 *  - the override makes the rules see the caller: `auth.token.email` for
 *    ownership and `root.child('admins/' + auth.uid)` for admins; writes the
 *    domain would refuse, sent straight through the adapter, are rejected by
 *    the rules;
 *  - when the domain accepts what the rules reject, the API answers 500 and
 *    logs the disagreement instead of reporting success.
 * Only ID token verification is faked (tokens are "token-<uid>").
 */
'use strict';

const assert = require('assert');
const path = require('path');

// The same module instances the functions code uses (firebase-admin is a
// dependency of functions/ only).
const fromFunctions = name => require(require.resolve(name, { paths: [path.join(__dirname, '../../functions')] }));
const express = fromFunctions('express');
const { initializeApp, deleteApp } = fromFunctions('firebase-admin/app');
const { getDatabase } = fromFunctions('firebase-admin/database');

const { emulatorRulesFor } = require('./emulatorRules');
const { loadVariant } = require('../../functions/movements/domain/testing/projectPolicies');
const { departureInput, arrivalInput, stored } = require('../../functions/movements/domain/testing/movementCases');
const { toOrderKey } = require('../../functions/movements/domain/orderKey');
const { registerMovementRoutes } = require('../../functions/movements');
const { createRtdbMovementRepository } = require('../../functions/movements/adapters/rtdbMovementRepository');
const { RulesRejectedError, createDatabaseRestClient } = require('../../functions/movements/adapters/databaseRest');
const { listen } = require('../../functions/api/http/testing/listen');

const NAMESPACE = 'demo-movement-api';
const EMULATOR_HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST;

const EMAILS = {
  'pilot-uid': 'pilot@example.com',
  'other-uid': 'other@example.com',
  'admin-uid': 'admin@example.com',
  'stale-admin-uid': 'stale@example.com',
};
const ADMINS = { 'admin-uid': true, 'admin2-uid': true, 'stale-admin-uid': false };
const ACTORS = {
  pilot: { uid: 'pilot-uid', email: EMAILS['pilot-uid'], isAdmin: false },
  guest: { uid: 'guest', email: null, isAdmin: false },
  kiosk: { uid: 'kiosk', email: null, isAdmin: false },
  admin: { uid: 'admin-uid', email: EMAILS['admin-uid'], isAdmin: true },
  adminWithoutEmail: { uid: 'admin2-uid', email: null, isAdmin: true },
  staleAdmin: { uid: 'stale-admin-uid', email: EMAILS['stale-admin-uid'], isAdmin: false },
};

const fakeAuth = () => ({
  verifyIdToken: async token => {
    const uid = token.replace(/^token-/, '');
    return EMAILS[uid] ? { uid, email: EMAILS[uid] } : { uid };
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

// Captures what the functions logger writes to stderr while `run` runs.
async function captureStderr(run) {
  const lines = [];
  const write = process.stderr.write;
  process.stderr.write = (chunk, ...rest) => {
    lines.push(String(chunk));
    return write.call(process.stderr, chunk, ...rest);
  };
  try {
    await run();
  } finally {
    process.stderr.write = write;
  }
  return lines.join('');
}

function client(server) {
  return (method, path, uid, body) => server.request(path, {
    method,
    headers: { Authorization: `Bearer token-${uid}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function expectStatus(response, status) {
  const body = await response.json();
  assert.strictEqual(response.status, status, `expected ${status}, got ${response.status} ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  assert.ok(EMULATOR_HOST, 'FIREBASE_DATABASE_EMULATOR_HOST is not set; run via npm run test:rules');
  // A stub credential: against the emulator nothing needs a Google token.
  const credential = { getAccessToken: async () => ({ access_token: 'owner', expires_in: 3600 }) };
  const app = initializeApp({
    projectId: NAMESPACE,
    databaseURL: `https://${NAMESPACE}.firebaseio.com`,
    credential,
  }, 'movement-api');
  const db = getDatabase(app);
  const { rulesConfig, serverConfig, policy } = loadVariant('lsze');
  await loadRules(rulesConfig);

  const read = async path => (await db.ref(path).once('value')).val();
  const seed = async () => {
    await db.ref().set(null);
    await db.ref('admins').set(ADMINS);
    await db.ref('departures/pilot1').set(stored('departure', policy, { createdBy: EMAILS['pilot-uid'] }));
    await db.ref('departures/other1').set(stored('departure', policy, { createdBy: EMAILS['other-uid'] }));
    await db.ref('departures/ownerless1').set(stored('departure', policy));
    await db.ref('arrivals/pilot1').set(stored('arrival', policy, { createdBy: EMAILS['pilot-uid'] }));
  };

  const appOptions = { auth: fakeAuth, db: () => db };
  const repository = createRtdbMovementRepository({
    db: () => db,
    rest: createDatabaseRestClient({ app: () => app }),
  });
  const api = express();
  registerMovementRoutes(api, serverConfig, { ...appOptions, repository });
  const server = await listen(api);
  const send = client(server);

  console.log('movement API writes (rules of lsze, as the caller)');
  await seed();

  await check('pilot creates a departure the rules accept, owned by the pilot', async () => {
    const { key } = await expectStatus(await send('POST', '/api/app/movements/departures', 'pilot-uid', departureInput(policy)), 201);
    const movement = await read(`departures/${key}`);
    const negativeTimestamp = -Date.parse(movement.dateTime);
    assert.deepStrictEqual(movement, {
      ...departureInput(policy),
      createdBy: EMAILS['pilot-uid'],
      negativeTimestamp,
      createdBy_orderKey: toOrderKey(EMAILS['pilot-uid'], negativeTimestamp),
    });
  });

  await check('pilot updates an own departure (merge, null removes)', async () => {
    await expectStatus(await send('PATCH', '/api/app/movements/departures/pilot1', 'pilot-uid', { remarks: 'new', phone: null }), 200);
    const movement = await read('departures/pilot1');
    assert.strictEqual(movement.remarks, 'new');
    assert.strictEqual(movement.immatriculation, 'HBABC');
    assert.strictEqual(movement.createdBy, EMAILS['pilot-uid']);
  });

  await check('pilot sets only the payment method of an own arrival', async () => {
    const paymentMethod = { method: 'checkout', status: 'pending' };
    await expectStatus(await send('PATCH', '/app/movements/arrivals/pilot1', 'pilot-uid', { paymentMethod }), 200);
    assert.deepStrictEqual((await read('arrivals/pilot1')).paymentMethod, paymentMethod);
  });

  await check('pilot cannot update another pilot\'s departure (403, unchanged)', async () => {
    await expectStatus(await send('PATCH', '/api/app/movements/departures/other1', 'pilot-uid', { remarks: 'x' }), 403);
    assert.strictEqual((await read('departures/other1')).remarks, undefined);
  });

  await check('guest creates an ownerless arrival', async () => {
    const { key } = await expectStatus(await send('POST', '/api/app/movements/arrivals', 'guest', arrivalInput(policy)), 201);
    const movement = await read(`arrivals/${key}`);
    assert.strictEqual(movement.createdBy, undefined);
    assert.strictEqual(movement.createdBy_orderKey, undefined);
  });

  await check('kiosk updates an ownerless departure', async () => {
    await expectStatus(await send('PATCH', '/api/app/movements/departures/ownerless1', 'kiosk', { remarks: 'kiosk' }), 200);
    assert.strictEqual((await read('departures/ownerless1')).remarks, 'kiosk');
  });

  await check('admin updates another pilot\'s departure, keeping its owner', async () => {
    await expectStatus(await send('PATCH', '/api/app/movements/departures/other1', 'admin-uid', { remarks: 'checked' }), 200);
    const movement = await read('departures/other1');
    assert.strictEqual(movement.remarks, 'checked');
    assert.strictEqual(movement.createdBy, EMAILS['other-uid']);
  });

  await check('a locked movement is refused (409)', async () => {
    await db.ref('settings/lockDate').set(Date.parse('2026-12-01T00:00:00.000Z'));
    try {
      await expectStatus(await send('PATCH', '/api/app/movements/departures/pilot1', 'pilot-uid', { remarks: 'late' }), 409);
    } finally {
      await db.ref('settings/lockDate').set(null);
    }
  });

  console.log('the rules see the caller of an adapter write');
  await seed();
  const departure = createdBy => stored('departure', policy, createdBy ? { createdBy } : {});

  await check('pilot: own create accepted', () =>
    repository.createMovement('departure', departure(EMAILS['pilot-uid']), ACTORS.pilot));
  await check('pilot: create owned by another pilot rejected (auth.token.email)', () =>
    rejectedByRules(repository.createMovement('departure', departure(EMAILS['other-uid']), ACTORS.pilot)));
  await check('pilot: update of another pilot\'s movement rejected', () =>
    rejectedByRules(repository.updateMovement('departure', 'other1', { remarks: 'x' }, ACTORS.pilot)));
  await check('pilot: taking over an ownerless movement rejected', () =>
    rejectedByRules(repository.updateMovement('departure', 'ownerless1', { createdBy: EMAILS['pilot-uid'] }, ACTORS.pilot)));
  await check('guest: create of an owned movement rejected', () =>
    rejectedByRules(repository.createMovement('departure', departure(EMAILS['pilot-uid']), ACTORS.guest)));
  await check('kiosk: update of an owned movement rejected', () =>
    rejectedByRules(repository.updateMovement('departure', 'pilot1', { remarks: 'x' }, ACTORS.kiosk)));
  await check('guest: ownerless create accepted', () =>
    repository.createMovement('departure', departure(null), ACTORS.guest));
  await check('admin: update of another pilot\'s movement accepted (admins/<uid>)', () =>
    repository.updateMovement('departure', 'other1', { remarks: 'admin' }, ACTORS.admin));
  await check('admin without e-mail: update accepted (admins/<uid>)', () =>
    repository.updateMovement('departure', 'other1', { remarks: 'admin2' }, ACTORS.adminWithoutEmail));
  await check('stale admin (admins/<uid> false): update rejected', () =>
    rejectedByRules(repository.updateMovement('departure', 'other1', { remarks: 'x' }, ACTORS.staleAdmin)));
  await check('admin: invalid movement rejected (.validate still applies)', () =>
    rejectedByRules(repository.createMovement('departure', { remarks: 'only' }, ACTORS.admin)));
  await check('the rejected writes changed nothing', async () => {
    assert.strictEqual((await read('departures/other1')).remarks, 'admin2');
    assert.strictEqual((await read('departures/pilot1')).remarks, undefined);
    assert.strictEqual((await read('departures/ownerless1')).createdBy, undefined);
  });

  console.log('domain and rules disagree');
  await seed();
  // The API's policy allows runway 99, the rules of lsze do not.
  const laxConfig = {
    ...serverConfig,
    aerodrome: { ...serverConfig.aerodrome, runways: [...serverConfig.aerodrome.runways, { name: '99' }] },
  };
  const laxApi = express();
  registerMovementRoutes(laxApi, laxConfig, { ...appOptions, repository });
  const laxServer = await listen(laxApi);

  await check('a write the rules reject is a logged 500, not a success', async () => {
    let response;
    const logged = await captureStderr(async () => {
      response = await client(laxServer)('POST', '/api/app/movements/departures', 'pilot-uid', departureInput(policy, { runway: '99' }));
    });
    assert.deepStrictEqual(await expectStatus(response, 500), { error: { code: 'internal', message: 'Internal error' } });
    assert.ok(logged.includes('Movement write rejected by database rules after the domain accepted it'), 'distinct log line missing');
    assert.strictEqual(Object.values((await read('departures')) || {}).filter(m => m.runway === '99').length, 0);
  });

  await laxServer.close();
  await server.close();
  await deleteApp(app);
}

main().then(() => {
  if (failures > 0) {
    console.error(`\n${failures} movement API assertion(s) failed`);
    process.exit(1);
  }
  console.log('\nAll movement API write assertions passed');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
