import {getEnabledPaymentMethods, getLabel, PAYMENT_METHODS} from './paymentMethods';

describe('util', () => {
  describe('paymentMethods', () => {
    describe('getEnabledPaymentMethods', () => {
      it('includes methods without authCondition', () => {
        const methods = [{name: 'card'}, {name: 'cash'}];
        const result = getEnabledPaymentMethods(methods, {kiosk: false});
        expect(result).toEqual(['card', 'cash']);
      });

      it('filters out kiosk-only methods for non-kiosk auth', () => {
        const methods = [
          {name: 'card', authCondition: 'kiosk'},
          {name: 'cash'}
        ];
        const result = getEnabledPaymentMethods(methods, {kiosk: false});
        expect(result).toEqual(['cash']);
      });

      it('includes kiosk-only methods for kiosk auth', () => {
        const methods = [
          {name: 'card', authCondition: 'kiosk'},
          {name: 'cash'}
        ];
        const result = getEnabledPaymentMethods(methods, {kiosk: true});
        expect(result).toEqual(['card', 'cash']);
      });

      it('filters in notKiosk methods for non-kiosk auth', () => {
        const methods = [
          {name: 'card', authCondition: 'notKiosk'},
          {name: 'cash'}
        ];
        const result = getEnabledPaymentMethods(methods, {kiosk: false});
        expect(result).toEqual(['card', 'cash']);
      });

      it('filters out notKiosk methods for kiosk auth', () => {
        const methods = [
          {name: 'card', authCondition: 'notKiosk'},
          {name: 'cash'}
        ];
        const result = getEnabledPaymentMethods(methods, {kiosk: true});
        expect(result).toEqual(['cash']);
      });
    });

    describe('getLabel', () => {
      it('returns label for card payment', () => {
        expect(getLabel({method: 'card'})).toBe('Karte');
      });

      it('returns label for cash payment', () => {
        expect(getLabel({method: 'cash'})).toBe('Bar');
      });

      it('returns label for twint_external payment', () => {
        expect(getLabel({method: 'twint_external'})).toBe('Twint');
      });

      it('returns label with recipient name for invoice payment', () => {
        const result = getLabel({method: 'invoice', invoiceRecipientName: 'Müller AG'});
        expect(result).toBe('Rechnung (Müller AG)');
      });

      it('returns method value as-is for unknown payment method', () => {
        expect(getLabel({method: 'unknown_method'})).toBe('unknown_method');
      });
    });
  });
});
