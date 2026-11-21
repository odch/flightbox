'use strict';

const { getArrivalPayment, payArrival } = require('./payArrival');
const { loadVariant } = require('../domain/testing/projectPolicies');
const { stored } = require('../domain/testing/movementCases');

const KEY = '-Nabc123_XYZ-def4567';
const PILOT = { uid: 'login:s1', email: 'pilot@example.com', isAdmin: false, isGuest: false, isKiosk: false, scopes: ['movements:write'] };

function repositoryWith({ arrival, facts = {}, checkout = { url: 'https://pay.example.com/c/1' }, feeLater } = {}) {
  let current = arrival;
  let reads = 0;
  return {
    findMovement: jest.fn(async () => {
      reads += 1;
      if (feeLater && reads > feeLater.after) {
        current = { ...current, feeTotalGross: feeLater.fee };
      }
      return current;
    }),
    loadWriteSettings: jest.fn(async () => ({ lockDate: null, lockDateIso: null, customsBaseUrl: null })),
    updateMovement: jest.fn(async () => undefined),
    loadPaymentFacts: jest.fn(async () => ({ invoiceRecipientNames: [], isHomeBase: false, ...facts })),
    createCardPayment: jest.fn(async () => '-Npay1'),
    waitForCheckout: jest.fn(async () => checkout),
  };
}

describe('functions', () => {
  describe('movements/application/payArrival', () => {
    const { policy } = loadVariant('lsze'); // checkout (notKiosk), card_external (kiosk), invoice; homebasePayment
    const arrival = (overrides = {}) => ({
      ...stored('arrival', policy, { createdBy: PILOT.email }),
      landingFeeSingle: 27.75, landingFeeTotal: 27.75, feeTotalGross: 30, ...overrides,
    });
    const sleep = jest.fn(async () => undefined);
    const run = (useCase, repository, props = {}) =>
      useCase({ repository, policy, actor: PILOT, key: KEY, sleep, now: () => 1700000000000, ...props });

    beforeEach(() => sleep.mockClear());

    it('offers the pilot what the app would: online payment, invoice to their recipients', async () => {
      const repository = repositoryWith({ arrival: arrival(), facts: { invoiceRecipientNames: ['Fluggruppe A'] } });

      expect(await run(getArrivalPayment, repository)).toEqual({
        ok: true, due: true, amount: 30, currency: 'CHF', state: 'open',
        options: [{ method: 'checkout' }, { method: 'invoice', invoiceRecipientName: 'Fluggruppe A' }],
      });
      expect(repository.loadPaymentFacts).toHaveBeenCalledWith(PILOT, expect.objectContaining({ feeTotalGross: 30 }));
    });

    it('waits briefly for the fee the server computes after the write', async () => {
      const repository = repositoryWith({ arrival: arrival({ feeTotalGross: undefined }), feeLater: { after: 2, fee: 30 } });

      expect((await run(getArrivalPayment, repository)).amount).toBe(30);
      expect(sleep).toHaveBeenCalledTimes(2);
    });

    it('starts an online payment: method pending, the card payment as the app writes it, the checkout URL', async () => {
      const repository = repositoryWith({ arrival: arrival() });

      expect(await run(payArrival, repository, { choice: { method: 'checkout' } }))
        .toEqual({ ok: true, method: 'checkout', checkoutUrl: 'https://pay.example.com/c/1' });
      expect(repository.updateMovement).toHaveBeenCalledWith(
        'arrival', KEY, expect.objectContaining({ paymentMethod: { method: 'checkout', status: 'pending' } }), PILOT);
      expect(repository.createCardPayment).toHaveBeenCalledWith(expect.objectContaining({
        amount: 3000, currency: 'CHF', method: 'checkout', arrivalReference: KEY, refNr: '4567', status: 'pending', owner: 'login:s1',
      }), PILOT);
      // The method is recorded before the payment exists, so a paid payment always finds it pending.
      expect(repository.updateMovement.mock.invocationCallOrder[0]).toBeLessThan(repository.createCardPayment.mock.invocationCallOrder[0]);
    });

    it('records an invoice to an offered recipient only', async () => {
      const repository = repositoryWith({ arrival: arrival(), facts: { invoiceRecipientNames: ['Fluggruppe A'] } });

      expect(await run(payArrival, repository, { choice: { method: 'invoice', invoiceRecipientName: 'Fluggruppe A' } }))
        .toEqual({ ok: true, method: 'invoice', invoiceRecipientName: 'Fluggruppe A' });
      expect(await run(payArrival, repository, { choice: { method: 'invoice', invoiceRecipientName: 'Fremde AG' } }))
        .toEqual({ ok: false, code: 'invalid-argument', reason: 'method-not-offered' });
      expect(await run(payArrival, repository, { choice: { method: 'card_external' } }))
        .toEqual({ ok: false, code: 'invalid-argument', reason: 'method-not-offered' });
      expect(repository.createCardPayment).not.toHaveBeenCalled();
    });

    it('refuses what cannot be paid: another pilot\'s, paid, or nothing due', async () => {
      expect(await run(payArrival, repositoryWith({ arrival: arrival({ createdBy: 'other@example.com' }) }), { choice: { method: 'checkout' } }))
        .toEqual({ ok: false, code: 'permission-denied', reason: 'not-owner' });
      expect(await run(payArrival, repositoryWith({ arrival: arrival({ paymentMethod: { method: 'invoice', invoiceRecipientName: 'A' } }) }), { choice: { method: 'checkout' } }))
        .toEqual({ ok: false, code: 'failed-precondition', reason: 'already-paid' });
      expect(await run(payArrival, repositoryWith({ arrival: arrival({ feeTotalGross: 0 }) }), { choice: { method: 'checkout' } }))
        .toEqual({ ok: false, code: 'failed-precondition', reason: 'no-payment-due' });
      expect(await run(payArrival, repositoryWith({ arrival: null }), { choice: { method: 'checkout' } }))
        .toEqual({ ok: false, code: 'not-found', reason: 'not-found' });
    });

    it('lets a pending online payment be started again, and reports a failed or slow one', async () => {
      const pending = arrival({ paymentMethod: { method: 'checkout', status: 'pending' } });
      expect((await run(payArrival, repositoryWith({ arrival: pending }), { choice: { method: 'checkout' } })).ok).toBe(true);
      expect(await run(payArrival, repositoryWith({ arrival: arrival(), checkout: { failed: true } }), { choice: { method: 'checkout' } }))
        .toEqual({ ok: false, code: 'failed-precondition', reason: 'checkout-failed' });
      expect(await run(payArrival, repositoryWith({ arrival: arrival(), checkout: { pending: true } }), { choice: { method: 'checkout' } }))
        .toEqual({ ok: true, method: 'checkout', checkoutUrl: null });
    });
  });
});
