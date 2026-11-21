'use strict';

const { PAYMENT_METHODS } = require('./validateMovement');
const { hasOwn, isPlainObject } = require('./normalize');
// The server's port of the app's reference number (with client parity tests,
// src/util/airstatOracles/referenceNumber.spec.js).
const { getFromItemKey: referenceNumber } = require('../../reports/airstat/referenceNumber');

// How a landing fee can be paid, decided exactly as the app's arrival wizard
// does (parity: src/util/paymentOptions.parity.spec.ts):
//  - whether to pay at all: a fee is due (feeTotalGross > 0) and the aircraft
//    is not a home-base or club aircraft, unless the aerodrome wants those to
//    pay too (homebasePayment) (Finish.tsx showPayment);
//  - which methods: the aerodrome's paymentMethods whose authCondition holds
//    for the caller (getEnabledPaymentMethods), the card terminal only for
//    local sign-ins, invoice only to recipients the caller's e-mail is listed
//    for (ArrivalFinishContainer.tsx), in the order of the client's
//    PAYMENT_METHODS, invoice once per recipient (PaymentMethod.tsx).

const AUTH_CONDITIONS = Object.freeze({
  kiosk: caller => caller.kiosk === true,
  notKiosk: caller => caller.kiosk !== true,
});

/**
 * The caller as the app's auth data sees it. local: guest and kiosk sessions
 * (and, in the app only, a device marked as a local sign-in); a caller of the
 * central login is neither.
 */
function paymentCaller(actor) {
  const kiosk = actor.isKiosk === true;
  return { kiosk, local: kiosk || actor.isGuest === true };
}

/** The method names the caller may choose (getEnabledPaymentMethods + container filters). */
function enabledPaymentMethods(paymentMethods, caller, invoiceRecipientNames) {
  return paymentMethods
    .filter(method => !method.authCondition || (hasOwn(AUTH_CONDITIONS, method.authCondition)
      && AUTH_CONDITIONS[method.authCondition](caller)))
    .map(method => method.name)
    .filter(name => (name === 'card' ? caller.local === true : true))
    .filter(name => (name === 'invoice' ? invoiceRecipientNames.length > 0 : true));
}

/**
 * Where the payment of an arrival stands: 'open' (no method chosen),
 * 'pending' (online payment started, not completed), 'paid' (completed) or
 * 'arranged' (cash, terminal, TWINT or invoice: settled outside the app).
 */
function paymentState(arrival) {
  const payment = arrival.paymentMethod;
  if (!isPlainObject(payment) || typeof payment.method !== 'string') {
    return 'open';
  }
  if (payment.status === 'completed') {
    return 'paid';
  }
  if (payment.method === 'checkout' && payment.status === 'pending') {
    return 'pending';
  }
  return 'arranged';
}

/**
 * Pure. {due, amount, currency, options: [{method, invoiceRecipientName?}],
 * state}; options are empty when nothing is due.
 */
function paymentOptions({ arrival, policy, caller, isHomeBase, invoiceRecipientNames }) {
  const amount = typeof arrival.feeTotalGross === 'number' ? arrival.feeTotalGross : null;
  const state = paymentState(arrival);
  const due = (isHomeBase !== true || policy.homebasePayment === true) && amount !== null && amount > 0;
  if (!due) {
    return { due: false, amount, currency: 'CHF', options: [], state };
  }
  const enabled = enabledPaymentMethods(policy.paymentMethods, caller, invoiceRecipientNames);
  const options = PAYMENT_METHODS
    .filter(method => enabled.includes(method) && method !== 'invoice')
    .map(method => ({ method }));
  if (enabled.includes('invoice')) {
    invoiceRecipientNames.forEach(name => options.push({ method: 'invoice', invoiceRecipientName: name }));
  }
  return { due: true, amount, currency: 'CHF', options, state };
}

/**
 * Pure. The /card-payments entry of an online payment, as the app writes it
 * (src/modules/ui/arrivalPayment/sagas.ts createCardPayment); the payment
 * service listening there answers with the checkout URL (`data`) and the
 * status. The amount is the arrival's fee in cents, which
 * updateArrivalPaymentStatus.js checks before it marks the arrival paid.
 */
function checkoutPayment(key, arrival, { owner, now }) {
  const payment = {
    amount: Math.round(arrival.feeTotalGross * 100),
    currency: 'CHF',
    method: 'checkout',
    email: arrival.email,
    immatriculation: arrival.immatriculation,
    landings: arrival.landingCount,
    landingFeeSingle: arrival.landingFeeSingle,
    landingFeeTotal: arrival.landingFeeTotal,
    refNr: referenceNumber(key),
    arrivalReference: key,
    status: 'pending',
    timestamp: now,
  };
  if (owner) {
    payment.owner = owner;
  }
  if (arrival.landingFeeCode) {
    payment.landingFeeCode = arrival.landingFeeCode;
  }
  if (arrival.goAroundCount && arrival.goAroundFeeTotal) {
    payment.goArounds = arrival.goAroundCount;
    payment.goAroundFeeSingle = arrival.goAroundFeeSingle;
    payment.goAroundFeeCode = arrival.goAroundFeeCode;
    payment.goAroundFeeTotal = arrival.goAroundFeeTotal;
  }
  return Object.fromEntries(Object.entries(payment).filter(([, value]) => value !== undefined && value !== null));
}

module.exports = { paymentOptions, paymentState, paymentCaller, enabledPaymentMethods, checkoutPayment, referenceNumber };
