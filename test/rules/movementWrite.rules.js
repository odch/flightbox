/**
 * Emulator-based security-rules test for movement write ownership.
 *
 * Run via: npm run test:rules  (starts the RTDB emulator, then runs this).
 *
 * Verifies, against the *built* rules:
 *  - personal-access projects (loginForm === 'email'): pilots write only their
 *    own movements, guest/kiosk create/edit ownerless ones, admins write all;
 *  - shared-access projects (e.g. lspv): any authenticated user writes anything.
 */
'use strict';

const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const { ref, set, update, remove } = require('firebase/database');

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
    await set(ref(db, 'departures/alice_edit'), validDeparture(config, 'alice@example.com'));
    await set(ref(db, 'departures/alice_delete'), validDeparture(config, 'alice@example.com'));
    await set(ref(db, 'departures/ownerless_edit'), validDeparture(config));
    await set(ref(db, 'departures/owned_for_guest'), validDeparture(config, 'alice@example.com'));
  });

  const alice = env.authenticatedContext('alice-uid', { email: 'alice@example.com' }).database();
  const bob = env.authenticatedContext('bob-uid', { email: 'bob@example.com' }).database();
  const guest = env.authenticatedContext('guest').database();
  const admin = env.authenticatedContext('admin-uid').database();
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
  });

  const bob = env.authenticatedContext('bob-uid', { email: 'bob@example.com' }).database();
  const anon = env.unauthenticatedContext().database();

  await expect('any authed user creates with any createdBy', true, set(ref(bob, 'departures/new_shared'), validDeparture(config, 'alice@example.com')));
  await expect('any authed user edits another movement', true, update(ref(bob, 'departures/someone'), { remarks: 'shared' }));
  await expect('any authed user deletes another movement', true, remove(ref(bob, 'departures/someone')));
  await expect('unauthenticated cannot write', false, set(ref(anon, 'departures/new_anon'), validDeparture(config, 'x@example.com')));

  await env.cleanup();
}

(async () => {
  await testPersonalAccess();
  await testSharedAccess();
  if (failures > 0) {
    console.error(`\n${failures} rule assertion(s) failed`);
    process.exit(1);
  }
  console.log('\nAll movement-write rule assertions passed');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
