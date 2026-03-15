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
      const t = (key: string) => key;

      it('returns translation key for card payment', () => {
        expect(getLabel({method: 'card'}, t)).toBe('paymentMethods.card');
      });

      it('returns translation key for cash payment', () => {
        expect(getLabel({method: 'cash'}, t)).toBe('paymentMethods.cash');
      });

      it('returns translation key for twint_external payment', () => {
        expect(getLabel({method: 'twint_external'}, t)).toBe('paymentMethods.twint_external');
      });

      it('returns translation key with recipient name for invoice payment', () => {
        const result = getLabel({method: 'invoice', invoiceRecipientName: 'Müller AG'}, t);
        expect(result).toBe('paymentMethods.invoice (Müller AG)');
      });

      it('returns method value as-is for unknown payment method', () => {
        expect(getLabel({method: 'unknown_method'}, t)).toBe('unknown_method');
      });
    });
  });
});
