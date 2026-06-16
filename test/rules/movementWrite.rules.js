/**
 * Emulator-based security-rules test for movement read/write scoping.
 *
 * Run via: npm run test:rules  (starts the RTDB emulator, then runs this).
 *
 * Verifies, against the *built* rules:
 *  - personal-access projects (loginForm === 'email'): pilots read/write only
 *    their own movements (reads via email-bounded queries or owner key reads),
 *    guest/kiosk create/edit ownerless ones and read none, admins read/write all;
 *  - shared-access projects (e.g. lspv): any authenticated user reads/writes all.
 */
'use strict';

const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const {
  ref, set, update, remove,
  query, orderByChild, startAt, endAt, limitToFirst, get,
} = require('firebase/database');

const SENTINEL = '\uf8ff'; // Firebase high-codepoint upper bound

// A pilot's own movements: createdBy_orderKey values all start with `${email}_`.
function ownQuery(db, path, email) {
  return query(ref(db, path), orderByChild('createdBy_orderKey'), startAt(email + '_'), endAt(email + '_' + SENTINEL), limitToFirst(20));
}
function unboundedQuery(db, path) {
  return query(ref(db, path), orderByChild('negativeTimestamp'), startAt(-9999999999999), limitToFirst(20));
}

const projects = require('../../projects');
const { buildRules } = require('../../tasks/processFirebaseRules');
const aircraftCategories = require('../../src/util/aircraftCategoriesData');

// The RTDB *emulator's* regex engine rejects the production `messages` email
// `.validate` (it uses `\s`), though production accepts it. Neutralize only
// those regex validates for the emulator load — they are unrelated to the
// movement `.write` rules under test.
function sanitizeForEmulator(node) {
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      if (key === '.validate' && typeof node[key] === 'string' && node[key].includes('\\s')) {
        node[key] = 'newData.isString()';
      } else {
        sanitizeForEmulator(node[key]);
      }
    }
  }
}

function rulesFor(projectName) {
  const rules = buildRules(projects.load(projectName));
  sanitizeForEmulator(rules);
  return JSON.stringify(rules);
}

function validDeparture(config, createdBy) {
  const d = {
    aircraftType: 'C172',
    dateTime: '2026-06-16T10:00:00.000Z',
    departureRoute: config.aerodrome.departureRoutes[0].name,
    duration: '01:30',
    email: 'pilot@example.com',
    firstname: 'Test',
    flightType: config.enabledFlightTypes[0],
    immatriculation: 'HBABC',
    lastname: 'Pilot',
    location: config.aerodrome.ICAO,
    mtow: 1000,
    aircraftCategory: aircraftCategories[0].name,
    negativeTimestamp: -1700000000000,
  };
  if (createdBy) d.createdBy = createdBy;
  return d;
}

let failures = 0;
async function expect(label, shouldPass, promise) {
  try {
    await (shouldPass ? assertSucceeds(promise) : assertFails(promise));
    console.log(`  ✓ ${label}`);
  } catch (e) {
    failures++;
    console.error(`  ✗ ${label} — ${e.message}`);
  }
}

async function testPersonalAccess() {
  console.log('personal-access (lszm, loginForm=email)');
  const config = projects.load('lszm');
  const env = await initializeTestEnvironment({
    projectId: 'demo-personal',
    database: { rules: rulesFor('lszm') },
  });

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await set(ref(db, 'admins/admin-uid'), true);
    await set(ref(db, 'logins/operator-uid/allMovements'), true);
    await set(ref(db, 'departures/alice_edit'), validDeparture(config, 'alice@example.com'));
    await set(ref(db, 'departures/alice_delete'), validDeparture(config, 'alice@example.com'));
    await set(ref(db, 'departures/ownerless_edit'), validDeparture(config));
    await set(ref(db, 'departures/owned_for_guest'), validDeparture(config, 'alice@example.com'));
    await set(ref(db, 'departures/alice_read'), validDeparture(config, 'alice@example.com'));
    await set(ref(db, 'departures/bob_read'), validDeparture(config, 'bob@example.com'));
  });

  const alice = env.authenticatedContext('alice-uid', { email: 'alice@example.com' }).database();
  const bob = env.authenticatedContext('bob-uid', { email: 'bob@example.com' }).database();
  const guest = env.authenticatedContext('guest').database();
  const admin = env.authenticatedContext('admin-uid').database();
  const operator = env.authenticatedContext('operator-uid', { email: 'operator@example.com' }).database();
  const anon = env.unauthenticatedContext().database();

  // pilot
  await expect('pilot creates own', true, set(ref(alice, 'departures/new_alice'), validDeparture(config, 'alice@example.com')));
  await expect('pilot cannot create as someone else', false, set(ref(bob, 'departures/new_spoof'), validDeparture(config, 'alice@example.com')));
  await expect('pilot edits own', true, update(ref(alice, 'departures/alice_edit'), { remarks: 'mine' }));
  await expect('pilot cannot edit another pilot movement', false, update(ref(bob, 'departures/alice_edit'), { remarks: 'hacked' }));
  await expect('pilot cannot delete another pilot movement', false, remove(ref(bob, 'departures/alice_delete')));
  await expect('pilot deletes own', true, remove(ref(alice, 'departures/alice_delete')));

  // guest / kiosk
  await expect('guest creates ownerless', true, set(ref(guest, 'departures/new_guest'), validDeparture(config)));
  await expect('guest cannot create with a createdBy', false, set(ref(guest, 'departures/new_guest_spoof'), validDeparture(config, 'alice@example.com')));
  await expect('guest edits ownerless (e.g. payment)', true, update(ref(guest, 'departures/ownerless_edit'), { remarks: 'paid' }));
  await expect('guest cannot edit an owned movement', false, update(ref(guest, 'departures/owned_for_guest'), { remarks: 'nope' }));

  // admin / anon
  await expect('admin creates as anyone', true, set(ref(admin, 'departures/new_admin'), validDeparture(config, 'someone@example.com')));
  await expect('admin deletes any movement', true, remove(ref(admin, 'departures/owned_for_guest')));
  await expect('unauthenticated cannot write', false, set(ref(anon, 'departures/new_anon'), validDeparture(config, 'x@example.com')));

  // reads
  await expect('pilot reads own movements (bounded query)', true, get(ownQuery(alice, 'departures', 'alice@example.com')));
  await expect('pilot cannot read all movements (unbounded query)', false, get(unboundedQuery(alice, 'departures')));
  await expect('pilot cannot query another pilot prefix', false, get(ownQuery(alice, 'departures', 'bob@example.com')));
  await expect('pilot reads own movement by key', true, get(ref(alice, 'departures/alice_read')));
  await expect('pilot cannot read another movement by key', false, get(ref(alice, 'departures/bob_read')));
  await expect('guest cannot read movements', false, get(ownQuery(guest, 'departures', 'alice@example.com')));
  await expect('admin reads all movements (unbounded query)', true, get(unboundedQuery(admin, 'departures')));
  await expect('admin reads any movement by key', true, get(ref(admin, 'departures/bob_read')));
  await expect('allMovements operator reads all (unbounded query)', true, get(unboundedQuery(operator, 'departures')));
  await expect('allMovements operator reads any movement by key', true, get(ref(operator, 'departures/bob_read')));
  await expect('unauthenticated cannot read movements', false, get(ownQuery(anon, 'departures', 'alice@example.com')));

  await env.cleanup();
}

async function testSharedAccess() {
  console.log('shared-access (lspv, permissive)');
  const config = projects.load('lspv');
  const env = await initializeTestEnvironment({
    projectId: 'demo-shared',
    database: { rules: rulesFor('lspv') },
  });

  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await set(ref(db, 'departures/someone'), validDeparture(config, 'alice@example.com'));
    await set(ref(db, 'departures/shared_read'), validDeparture(config, 'alice@example.com'));
  });

  const bob = env.authenticatedContext('bob-uid', { email: 'bob@example.com' }).database();
  const anon = env.unauthenticatedContext().database();

  await expect('any authed user creates with any createdBy', true, set(ref(bob, 'departures/new_shared'), validDeparture(config, 'alice@example.com')));
  await expect('any authed user edits another movement', true, update(ref(bob, 'departures/someone'), { remarks: 'shared' }));
  await expect('any authed user deletes another movement', true, remove(ref(bob, 'departures/someone')));
  await expect('unauthenticated cannot write', false, set(ref(anon, 'departures/new_anon'), validDeparture(config, 'x@example.com')));
  await expect('any authed user reads all movements (unbounded query)', true, get(unboundedQuery(bob, 'departures')));
  await expect('any authed user reads any movement by key', true, get(ref(bob, 'departures/shared_read')));
  await expect('unauthenticated cannot read movements', false, get(unboundedQuery(anon, 'departures')));

  await env.cleanup();
}

(async () => {
  await testPersonalAccess();
  await testSharedAccess();
  if (failures > 0) {
    console.error(`\n${failures} rule assertion(s) failed`);
    process.exit(1);
  }
  console.log('\nAll movement read/write rule assertions passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
