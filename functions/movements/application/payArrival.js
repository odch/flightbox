'use strict';

const { CODES, REASONS } = require('../domain');
const { isOwnMovement } = require('../domain/readView');
const { checkoutPayment, paymentCaller, paymentOptions } = require('../domain/paymentOptions');
const { saveMovement } = require('./saveMovement');

// Use cases: how the caller may pay the landing fee of an arrival, and
// paying it, offering exactly what the app's arrival wizard offers
// (domain/paymentOptions.js). Cash, terminal and TWINT on site and invoice
// only record the method, as the app does; an online payment also writes
// the /card-payments entry the payment service answers with the checkout
// URL, and updateArrivalPaymentStatus.js marks the arrival paid afterwards.
//
// Repository port (adapters/rtdbMovementRepository.js), besides saveMovement's:
//   loadPaymentFacts(actor, arrival)   -> {invoiceRecipientNames, isHomeBase}
//   createCardPayment(payment, actor)  -> key
//   waitForCheckout(paymentId)         -> {url} | {failed} | {pending}
//
// Results: {ok: true, ...} or {ok: false, code, reason}.

// Where Flightbox prices arrivals on the server (computeArrivalFeesOnWrite),
// the fee lands just after the write: wait for it this long.
const FEE_WAIT = Object.freeze({ attempts: 6, intervalMs: 500 });

const reject = (code, reason) => ({ ok: false, code, reason });

async function loadPayment({ repository, policy, actor, key, sleep }) {
  let arrival = await repository.findMovement('arrival', key);
  if (arrival === null) {
    return { rejection: reject(REASONS.NOT_FOUND, REASONS.NOT_FOUND) };
  }
  // Like the app: the pilot's own arrivals; admins any.
  if (actor.isAdmin !== true && !isOwnMovement(arrival, actor.email)) {
    return { rejection: reject(CODES.PERMISSION_DENIED, REASONS.NOT_OWNER) };
  }
  for (let attempt = 0; typeof arrival.feeTotalGross !== 'number' && attempt < FEE_WAIT.attempts; attempt++) {
    await sleep(FEE_WAIT.intervalMs);
    arrival = (await repository.findMovement('arrival', key)) || arrival;
  }
  const facts = await repository.loadPaymentFacts(actor, arrival);
  const payment = paymentOptions({
    arrival,
    policy,
    caller: paymentCaller(actor),
    isHomeBase: facts.isHomeBase,
    invoiceRecipientNames: facts.invoiceRecipientNames,
  });
  return { arrival, payment };
}

const defaultSleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** {ok: true, due, amount, currency, options, state} or a rejection. */
async function getArrivalPayment({ repository, policy, actor, key, sleep = defaultSleep }) {
  const loaded = await loadPayment({ repository, policy, actor, key, sleep });
  return loaded.rejection || { ok: true, ...loaded.payment };
}

/**
 * choice: {method, invoiceRecipientName?}, one of the offered options.
 * Resolves with {ok: true, method, checkoutUrl?} (checkoutUrl null when the
 * payment service has not answered in time) or a rejection.
 */
async function payArrival({ repository, policy, actor, key, choice, now = Date.now, sleep = defaultSleep }) {
  const loaded = await loadPayment({ repository, policy, actor, key, sleep });
  if (loaded.rejection) {
    return loaded.rejection;
  }
  const { arrival, payment } = loaded;
  if (payment.state !== 'open' && payment.state !== 'pending') {
    return reject(CODES.FAILED_PRECONDITION, 'already-paid');
  }
  if (!payment.due) {
    return reject(CODES.FAILED_PRECONDITION, 'no-payment-due');
  }
  const offered = payment.options.find(option => option.method === choice.method
    && (option.method !== 'invoice' || option.invoiceRecipientName === choice.invoiceRecipientName));
  if (!offered) {
    return reject('invalid-argument', 'method-not-offered');
  }

  const paymentMethod = { method: offered.method };
  if (offered.method === 'invoice') {
    paymentMethod.invoiceRecipientName = offered.invoiceRecipientName;
  } else if (offered.method === 'checkout') {
    paymentMethod.status = 'pending';
  }
  // Through the movement write: ownership, lock and validation as for any change.
  const saved = await saveMovement({ repository, policy, actor, type: 'arrival', key, input: { paymentMethod } });
  if (!saved.ok) {
    return reject(saved.code, saved.reason || 'invalid');
  }
  if (offered.method !== 'checkout') {
    return { ok: true, method: offered.method, ...(offered.invoiceRecipientName ? { invoiceRecipientName: offered.invoiceRecipientName } : {}) };
  }

  const paymentId = await repository.createCardPayment(checkoutPayment(key, arrival, { owner: actor.uid, now: now() }), actor);
  const checkout = await repository.waitForCheckout(paymentId);
  if (checkout.failed) {
    return reject(CODES.FAILED_PRECONDITION, 'checkout-failed');
  }
  return { ok: true, method: 'checkout', checkoutUrl: checkout.url || null };
}

module.exports = { getArrivalPayment, payArrival, FEE_WAIT };
