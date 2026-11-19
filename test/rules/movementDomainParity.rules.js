/**
 * Emulator parity test: movement domain (functions/movements/domain) vs. the
 * built database rules.
 *
 * Run via: npm run test:rules  (starts the RTDB emulator, then runs this).
 *
 * For every case of functions/movements/domain/testing/movementCases.js and
 * every project policy (lsze, lszt, lspv, lsze with lockOnDateTime), the
 * domain decides on the write (prepareWrite -> validateMovement ->
 * checkWriteAccess). The data the domain would write is then written with the
 * actor's credentials against the rules built from the same project file:
 * a create as set() of the prepared movement, an update as update() of the
 * prepared patch, a delete as remove(). The rules must accept exactly the
 * writes the domain accepts.
 */
'use strict';

const {
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const { setLogLevel } = require('firebase/app');
const { ref, set, update, remove } = require('firebase/database');

const { emulatorRulesFor } = require('./emulatorRules');
const { VARIANT_NAMES, loadVariant } = require('../../functions/movements/domain/testing/projectPolicies');
const { buildCases, ACTORS, ADMIN_SEED } = require('../../functions/movements/domain/testing/movementCases');
const { decide } = require('../../functions/movements/domain/testing/decide');

// Denied writes are expected; keep the SDK from logging each one.
setLogLevel('error');

const PATHS = { departure: 'departures', arrival: 'arrivals' };

function contextFor(env, actor) {
  if (actor === null) {
    return env.unauthenticatedContext();
  }
  return env.authenticatedContext(actor.uid, actor.email ? { email: actor.email } : {});
}

async function seed(env, testCase, path) {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.database();
    await set(ref(db, 'admins'), ADMIN_SEED);
    const { lockDate, lockDateIso } = testCase.settings;
    if (lockDate !== undefined) {
      await set(ref(db, 'settings/lockDate'), lockDate);
    }
    if (lockDateIso !== undefined) {
      await set(ref(db, 'settings/lockDateIso'), lockDateIso);
    }
    if (testCase.customsBaseUrl !== undefined) {
      await set(ref(db, 'settings/customsDeclarationApp/baseUrl'), testCase.customsBaseUrl);
    }
    if (testCase.existing) {
      await set(ref(db, path), testCase.existing);
    }
  });
}

function write(db, testCase, decision, path) {
  const target = ref(db, path);
  switch (testCase.op) {
    case 'create':
      return set(target, decision.prepared.movement);
    case 'update':
      return update(target, decision.prepared.patch);
    case 'delete':
      return remove(target);
    default:
      throw new Error(`Unknown op ${testCase.op}`);
  }
}

async function rulesAccept(promise) {
  try {
    await promise;
    return true;
  } catch (e) {
    if (/PERMISSION_DENIED/i.test(e.message) || e.code === 'PERMISSION_DENIED') {
      return false;
    }
    throw e;
  }
}

function describeDecision(decision) {
  if (decision.ok) {
    return 'accept';
  }
  const reasons = decision.errors.map(({ field, reason }) => `${field}:${reason}`);
  if (!decision.access.ok) {
    reasons.push(`${decision.access.code}:${decision.access.reason}`);
  }
  return `reject (${reasons.join(', ')})`;
}

async function runVariant(variantName) {
  const { project, rulesConfig, policy } = loadVariant(variantName);
  const cases = buildCases(policy);
  const env = await initializeTestEnvironment({
    projectId: `demo-parity-${variantName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    database: { rules: emulatorRulesFor(rulesConfig) },
  });
  const databases = new Map();
  const databaseFor = actor => {
    const key = actor === null ? null : actor.uid;
    if (!databases.has(key)) {
      databases.set(key, contextFor(env, actor).database());
    }
    return databases.get(key);
  };
  Object.values(ACTORS).forEach(databaseFor);
  databaseFor(null);

  let mismatches = 0;
  for (const [index, testCase] of cases.entries()) {
    const path = `${PATHS[testCase.type]}/case${index}`;
    const decision = decide(policy, testCase);
    await seed(env, testCase, path);
    const accepted = await rulesAccept(write(databaseFor(testCase.actor), testCase, decision, path));
    if (accepted !== decision.ok) {
      mismatches++;
      console.error(`  ✗ ${testCase.name}: domain ${describeDecision(decision)}, rules ${accepted ? 'accept' : 'reject'}`);
    }
  }
  console.log(`${variantName} (rules of ${project}): ${cases.length - mismatches}/${cases.length} cases agree`);
  await env.cleanup();
  return mismatches;
}

(async () => {
  let mismatches = 0;
  for (const variantName of VARIANT_NAMES) {
    mismatches += await runVariant(variantName);
  }
  if (mismatches > 0) {
    console.error(`\n${mismatches} case(s) where the movement domain and the database rules disagree`);
    process.exit(1);
  }
  console.log('\nThe movement domain and the database rules agree on every case');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
