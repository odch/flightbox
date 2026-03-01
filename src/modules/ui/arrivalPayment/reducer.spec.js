import reducer, { Step } from './reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  method: null,
  step: Step.OPTIONS,
  failure: false,
  cardPaymentId: null,
};

describe('modules', () => {
  describe('ui', () => {
    describe('arrivalPayment', () => {
      describe('reducer', () => {
        it('should handle initial state', () => {
          expect(
            reducer(undefined, {})
          ).toEqual(INITIAL_STATE);
        });

        describe('ARRIVAL_PAYMENT_SET_METHOD', () => {
          it('should set the payment method and clear failure', () => {
            expect(
              reducer({
                method: null,
                step: Step.OPTIONS,
                failure: true,
                cardPaymentId: null,
              }, actions.setMethod('cash'))
            ).toEqual({
              method: 'cash',
              step: Step.OPTIONS,
              failure: false,
              cardPaymentId: null,
            });
          });

          it('should override an existing method', () => {
            expect(
              reducer({
                method: 'cash',
                step: Step.OPTIONS,
                failure: false,
                cardPaymentId: null,
              }, actions.setMethod('card'))
            ).toEqual({
              method: 'card',
              step: Step.OPTIONS,
              failure: false,
              cardPaymentId: null,
            });
          });
        });

        describe('ARRIVAL_PAYMENT_SET_STEP', () => {
          it('should set the step to CONFIRMED', () => {
            expect(
              reducer({
                method: 'cash',
                step: Step.OPTIONS,
                failure: false,
                cardPaymentId: null,
              }, actions.setStep(Step.CONFIRMED))
            ).toEqual({
              method: 'cash',
              step: Step.CONFIRMED,
              failure: false,
              cardPaymentId: null,
            });
          });

          it('should set the step to COMPLETED', () => {
            expect(
              reducer({
                method: 'cash',
                step: Step.CONFIRMED,
                failure: false,
                cardPaymentId: null,
              }, actions.setStep(Step.COMPLETED))
            ).toEqual({
              method: 'cash',
              step: Step.COMPLETED,
              failure: false,
              cardPaymentId: null,
            });
          });
        });

        describe('ARRIVAL_PAYMENT_SET_CARD_PAYMENT_ID', () => {
          it('should set the card payment id', () => {
            expect(
              reducer({
                method: 'card',
                step: Step.OPTIONS,
                failure: false,
                cardPaymentId: null,
              }, actions.setCardPaymentId('pay-123'))
            ).toEqual({
              method: 'card',
              step: Step.OPTIONS,
              failure: false,
              cardPaymentId: 'pay-123',
            });
          });
        });

        describe('ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE', () => {
          it('should set failure to true', () => {
            expect(
              reducer({
                method: 'card',
                step: Step.CONFIRMED,
                failure: false,
                cardPaymentId: 'pay-123',
              }, actions.cardPaymentFailure())
            ).toEqual({
              method: 'card',
              step: Step.CONFIRMED,
              failure: true,
              cardPaymentId: 'pay-123',
            });
          });
        });

        describe('ARRIVAL_PAYMENT_RESET', () => {
          it('should reset to initial state', () => {
            expect(
              reducer({
                method: 'card',
                step: Step.COMPLETED,
                failure: true,
                cardPaymentId: 'pay-123',
              }, actions.reset())
            ).toEqual(INITIAL_STATE);
          });
        });
      });
    });
  });
});
