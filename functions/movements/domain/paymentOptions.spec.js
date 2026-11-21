'use strict';

const { paymentOptions, paymentState, paymentCaller, checkoutPayment } = require('./paymentOptions');

const POLICY = {
  paymentMethods: [{ name: 'checkout', authCondition: 'notKiosk' }, { name: 'card_external', authCondition: 'kiosk' }, { name: 'invoice' }, { name: 'card' }],
  homebasePayment: false,
};
const PILOT = paymentCaller({ uid: 'login:s1', isKiosk: false, isGuest: false });
const options = (overrides = {}) => paymentOptions({
  arrival: { feeTotalGross: 30 }, policy: POLICY, caller: PILOT, isHomeBase: false, invoiceRecipientNames: [], ...overrides,
});

describe('movement domain', () => {
  describe('paymentOptions', () => {
    it('offers a remote pilot online payment, no kiosk terminal, no card terminal', () => {
      expect(options()).toEqual({ due: true, amount: 30, currency: 'CHF', options: [{ method: 'checkout' }], state: 'open' });
    });

    it('adds invoice once per recipient the pilot is listed for, last', () => {
      expect(options({ invoiceRecipientNames: ['Fluggruppe A', 'Firma B'] }).options).toEqual([
        { method: 'checkout' },
        { method: 'invoice', invoiceRecipientName: 'Fluggruppe A' },
        { method: 'invoice', invoiceRecipientName: 'Firma B' },
      ]);
    });

    it('offers the kiosk its terminal and the local card terminal', () => {
      const kiosk = paymentCaller({ uid: 'kiosk', isKiosk: true });
      expect(options({ caller: kiosk }).options).toEqual([{ method: 'card' }, { method: 'card_external' }]);
    });

    it('asks nothing without a fee or for home-base aircraft, unless homebasePayment', () => {
      expect(options({ arrival: { feeTotalGross: 0 } }).due).toBe(false);
      expect(options({ arrival: {} })).toEqual({ due: false, amount: null, currency: 'CHF', options: [], state: 'open' });
      expect(options({ isHomeBase: true }).due).toBe(false);
      expect(options({ isHomeBase: true, policy: { ...POLICY, homebasePayment: true } }).due).toBe(true);
    });
  });

  describe('paymentState', () => {
    it.each([
      [undefined, 'open'],
      [{ method: 'checkout', status: 'pending' }, 'pending'],
      [{ method: 'checkout', status: 'completed' }, 'paid'],
      [{ method: 'invoice', invoiceRecipientName: 'A' }, 'arranged'],
      [{ method: 'cash' }, 'arranged'],
      [{}, 'open'],
    ])('%j is %s', (paymentMethod, state) => {
      expect(paymentState({ paymentMethod })).toBe(state);
    });
  });

  describe('checkoutPayment', () => {
    it('writes what the app writes, the fee in cents', () => {
      const arrival = {
        feeTotalGross: 30, email: 'pilot@example.com', immatriculation: 'HBPIV', landingCount: 1,
        landingFeeSingle: 27.75, landingFeeTotal: 27.75, landingFeeCode: null,
      };
      expect(checkoutPayment('-Nabc123_XYZ-def4567', arrival, { owner: 'login:s1', now: 1700000000000 })).toEqual({
        amount: 3000, currency: 'CHF', method: 'checkout', email: 'pilot@example.com', immatriculation: 'HBPIV',
        landings: 1, landingFeeSingle: 27.75, landingFeeTotal: 27.75, refNr: '4567', arrivalReference: '-Nabc123_XYZ-def4567',
        status: 'pending', timestamp: 1700000000000, owner: 'login:s1',
      });
      expect(checkoutPayment('k', { ...arrival, feeTotalGross: 36.15, goAroundCount: 1, goAroundFeeSingle: 5, goAroundFeeTotal: 5 }, { now: 1 }))
        .toMatchObject({ amount: 3615, goArounds: 1, goAroundFeeTotal: 5 });
    });
  });
});
