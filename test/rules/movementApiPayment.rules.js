/**
 * Emulator test: paying a landing fee through the app API
 * (application/payArrival.js) against the built database rules of lsze.
 *
 * Run via: npm run test:rules  (starts the RTDB emulator, then runs this).
 *
 * With the real RTDB adapter, as a pilot with a token of the central login:
 *  - an online payment records the method (pending) on the arrival and
 *    pushes the /card-payments entry as the caller; the rules accept both;
 *    a stand-in for the payment service answers with the checkout URL;
 *  - an invoice to a recipient the pilot is listed for is recorded;
 *  - the rules still deny writing a payment method on another pilot's
 *    arrival, sent straight through the adapter.
 */
'use strict';

const assert = require('assert');
const path = require('path');

const fromFunctions = name => require(require.resolve(name, { paths: [path.join(__dirname, '../../functions')] }));
const { initializeApp, deleteApp } = fromFunctions('firebase-admin/app');
const { getDatabase } = fromFunctions('firebase-admin/database');

const { emulatorRulesFor } = require('./emulatorRules');
const { loadVariant } = require('../../functions/movements/domain/testing/projectPolicies');
const { stored } = require('../../functions/movements/domain/testing/movementCases');
const { payArrival, getArrivalPayment } = require('../../functions/movements/application/payArrival');
const { loginActor } = require('../../functions/api/http/appAuth');
const { createRtdbMovementRepository } = require('../../functions/movements/adapters/rtdbMovementRepository');
const { RulesRejectedError, createDatabaseRestClient } = require('../../functions/movements/adapters/databaseRest');

const NAMESPACE = 'demo-movement-api';
const EMULATOR_HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST;

let failures = 0;
async function check(label, test) {
  try {
    await test();
    console.log(`  ✓ ${label}`);
  } catch (e) {
    failures++;
    console.error(`  ✗ ${label} — ${e.stack}`);
  }
}

async function main() {
  assert.ok(EMULATOR_HOST, 'FIREBASE_DATABASE_EMULATOR_HOST is not set; run via npm run test:rules');
  const credential = { getAccessToken: async () => ({ access_token: 'owner', expires_in: 3600 }) };
  const app = initializeApp({ projectId: NAMESPACE, databaseURL: `https://${NAMESPACE}.firebaseio.com`, credential }, 'movement-api-payment');
  const db = getDatabase(app);
  const { rulesConfig, policy } = loadVariant('lsze');
  const rules = await fetch(`http://${EMULATOR_HOST}/.settings/rules.json?ns=${NAMESPACE}`, {
    method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: emulatorRulesFor(rulesConfig),
  });
  assert.strictEqual(rules.status, 200, await rules.text());

  const priced = createdBy => ({
    ...stored('arrival', policy, { createdBy }),
    landingFeeSingle: 27.75, landingFeeTotal: 27.75, feeTotalNet: 27.75, feeVat: 2.25, feeRoundingDifference: 0, feeTotalGross: 30,
  });
  await db.ref().set(null);
  await db.ref('settings/invoiceRecipients').set([{ name: 'Fluggruppe A', emails: ['pilot@example.com'] }]);
  await db.ref('arrivals').set({ own1: priced('pilot@example.com'), own2: priced('pilot@example.com'), other1: priced('other@example.com') });

  const rest = createDatabaseRestClient({ app: () => app });
  const repository = createRtdbMovementRepository({ db: () => db, rest, sleep: ms => new Promise(r => setTimeout(r, Math.min(ms, 100))) });
  const pilot = loginActor({ sub: 'sub-1', email: 'pilot@example.com', scopes: ['movements:write'] });
  const run = (useCase, key, choice) => useCase({ repository, policy, actor: pilot, key, choice });

  // Stand-in for the payment service: answers each new card payment with a checkout URL.
  const service = db.ref('card-payments').on('child_added', snapshot => {
    if (!snapshot.val().data) snapshot.ref.update({ data: `https://pay.example.com/c/${snapshot.key}` });
  });

  console.log('landing fee payment through the API (rules of lsze, as the caller)');

  await check('the pilot is offered online payment and invoice to their recipient', async () => {
    const result = await run(getArrivalPayment, 'own1');
    assert.deepStrictEqual(result.options, [{ method: 'checkout' }, { method: 'invoice', invoiceRecipientName: 'Fluggruppe A' }]);
  });

  await check('an online payment: method pending and the card payment, both accepted by the rules', async () => {
    const result = await run(payArrival, 'own1', { method: 'checkout' });
    assert.strictEqual(result.ok, true, JSON.stringify(result));
    assert.match(result.checkoutUrl, /^https:\/\/pay\.example\.com\/c\//);
    assert.deepStrictEqual((await db.ref('arrivals/own1/paymentMethod').once('value')).val(), { method: 'checkout', status: 'pending' });
    const payments = Object.values((await db.ref('card-payments').once('value')).val());
    assert.strictEqual(payments.length, 1);
    assert.strictEqual(payments[0].amount, 3000);
    assert.strictEqual(payments[0].arrivalReference, 'own1');
    assert.strictEqual(payments[0].owner, 'login:sub-1');
  });

  await check('an invoice to the pilot\'s recipient is recorded', async () => {
    const result = await run(payArrival, 'own2', { method: 'invoice', invoiceRecipientName: 'Fluggruppe A' });
    assert.strictEqual(result.ok, true, JSON.stringify(result));
    assert.deepStrictEqual((await db.ref('arrivals/own2/paymentMethod').once('value')).val(), { method: 'invoice', invoiceRecipientName: 'Fluggruppe A' });
  });

  await check('another pilot\'s arrival: refused by the API, and the rules deny the write too', async () => {
    assert.strictEqual((await run(payArrival, 'other1', { method: 'checkout' })).reason, 'not-owner');
    const error = await rest.write('PATCH', 'arrivals/other1', { paymentMethod: { method: 'cash' } }, { uid: 'login:sub-1', token: { email: 'pilot@example.com' } })
      .then(() => null, e => e);
    assert.ok(error instanceof RulesRejectedError, `expected a rules rejection, got ${error}`);
  });

  db.ref('card-payments').off('child_added', service);
  await deleteApp(app);
}

main().then(() => {
  if (failures > 0) {
    console.error(`\n${failures} payment assertion(s) failed`);
    process.exit(1);
  }
  console.log('\nAll payment assertions passed');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
