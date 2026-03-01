import {call, put, select} from 'redux-saga/effects';
import * as actions from './actions';
import * as sagas from './sagas';
import * as remote from './remote';
import {Step} from './reducer';

jest.mock('./remote');
jest.mock('../../../util/createChannel');

describe('modules', () => {
  describe('ui', () => {
    describe('arrivalPayment', () => {
      describe('sagas', () => {
        describe('cardPaymentIdSelector', () => {
          it('should select card payment id from state', () => {
            const state = {
              ui: {
                arrivalPayment: {
                  cardPaymentId: 'payment-123'
                }
              }
            };
            expect(sagas.cardPaymentIdSelector(state)).toEqual('payment-123');
          });
        });

        describe('createCardPayment', () => {
          it('should create a card payment and monitor its status', () => {
            const channel = {put: jest.fn()};
            const action = actions.createCardPayment(
              'movement-key-1',
              'REF-001',
              25.50,
              'CHF',
              'card',
              'pilot@example.com',
              'HB-KOF',
              1,
              25.50,
              null,
              25.50,
              null,
              null,
              null,
              null
            );

            const generator = sagas.createCardPayment(channel, action);

            const callEffect = generator.next().value;
            expect(callEffect).toMatchObject({type: 'CALL'});
            expect(callEffect.payload.fn).toBe(remote.create);
            expect(callEffect.payload.args[0]).toMatchObject({
              amount: 2550,
              currency: 'CHF',
              method: 'card',
              email: 'pilot@example.com',
              immatriculation: 'HB-KOF',
              landings: 1,
              landingFeeSingle: 25.50,
              landingFeeTotal: 25.50,
              refNr: 'REF-001',
              arrivalReference: 'movement-key-1',
              status: 'pending'
            });
            expect(callEffect.payload.args[0].landingFeeCode).toBeUndefined();

            const newPaymentRef = {key: 'new-payment-key'};
            expect(generator.next(newPaymentRef).value).toEqual(
              put(actions.setCardPaymentId('new-payment-key'))
            );

            expect(generator.next().value).toEqual(
              call(sagas.monitorPaymentStatus, newPaymentRef, channel)
            );

            expect(generator.next().done).toEqual(true);
          });

          it('should include optional fields when provided', () => {
            const channel = {put: jest.fn()};
            const action = actions.createCardPayment(
              'movement-key-2',
              'REF-002',
              50.00,
              'CHF',
              'card',
              'pilot@example.com',
              'HB-ABC',
              2,
              20.00,
              'LAND',
              40.00,
              1,
              10.00,
              'GA',
              10.00
            );

            const generator = sagas.createCardPayment(channel, action);

            const callEffect = generator.next().value;
            expect(callEffect.payload.args[0]).toMatchObject({
              landingFeeCode: 'LAND',
              goArounds: 1,
              goAroundFeeSingle: 10.00,
              goAroundFeeCode: 'GA',
              goAroundFeeTotal: 10.00
            });
          });
        });

        describe('monitorPaymentStatus', () => {
          let paymentRef;
          let channel;

          beforeEach(() => {
            paymentRef = {on: jest.fn(), off: jest.fn()};
            channel = {put: jest.fn()};
          });

          it('should register firebase listener and complete', () => {
            const generator = sagas.monitorPaymentStatus(paymentRef, channel);
            expect(generator.next().done).toEqual(true);
            expect(paymentRef.on).toHaveBeenCalledWith('value', expect.any(Function));
          });

          it('should redirect when data is present', () => {
            const generator = sagas.monitorPaymentStatus(paymentRef, channel);
            generator.next();

            const callback = paymentRef.on.mock.calls[0][1];
            const redirectUrl = 'https://payment.example.com/redirect';
            const snapshot = {val: () => ({data: redirectUrl, status: 'pending'})};

            const mockLocation = {href: ''};
            Object.defineProperty(window, 'location', {
              configurable: true,
              writable: true,
              value: mockLocation,
            });

            callback(snapshot);

            expect(window.location.href).toEqual(redirectUrl);
            expect(paymentRef.off).toHaveBeenCalledWith('value');
            expect(channel.put).not.toHaveBeenCalled();
          });

          it('should put setStep COMPLETED on success status', () => {
            const generator = sagas.monitorPaymentStatus(paymentRef, channel);
            generator.next();

            const callback = paymentRef.on.mock.calls[0][1];
            const snapshot = {val: () => ({data: null, status: 'success'})};
            callback(snapshot);

            expect(channel.put).toHaveBeenCalledWith(actions.setStep(Step.COMPLETED));
            expect(paymentRef.off).toHaveBeenCalledWith('value');
          });

          it('should put failure actions on failure status', () => {
            const generator = sagas.monitorPaymentStatus(paymentRef, channel);
            generator.next();

            const callback = paymentRef.on.mock.calls[0][1];
            const snapshot = {val: () => ({data: null, status: 'failure'})};
            callback(snapshot);

            expect(channel.put).toHaveBeenCalledTimes(3);
            expect(channel.put).toHaveBeenNthCalledWith(1, actions.setMethod(null));
            expect(channel.put).toHaveBeenNthCalledWith(2, actions.cardPaymentFailure());
            expect(channel.put).toHaveBeenNthCalledWith(3, actions.setStep(Step.OPTIONS));
            expect(paymentRef.off).toHaveBeenCalledWith('value');
          });

          it('should put cancelled actions on cancelled status', () => {
            const generator = sagas.monitorPaymentStatus(paymentRef, channel);
            generator.next();

            const callback = paymentRef.on.mock.calls[0][1];
            const snapshot = {val: () => ({data: null, status: 'cancelled'})};
            callback(snapshot);

            expect(channel.put).toHaveBeenCalledTimes(2);
            expect(channel.put).toHaveBeenNthCalledWith(1, actions.setMethod(null));
            expect(channel.put).toHaveBeenNthCalledWith(2, actions.setStep(Step.OPTIONS));
            expect(paymentRef.off).toHaveBeenCalledWith('value');
          });
        });

        describe('cancelCardPayment', () => {
          it('should call remote.update when cardPaymentId exists', () => {
            const generator = sagas.cancelCardPayment();

            expect(generator.next().value).toEqual(select(sagas.cardPaymentIdSelector));

            const cardPaymentId = 'payment-abc';
            expect(generator.next(cardPaymentId).value).toEqual(
              call(remote.update, cardPaymentId, {status: 'cancelled'})
            );

            expect(generator.next().done).toEqual(true);
          });

          it('should return immediately when cardPaymentId is null', () => {
            const generator = sagas.cancelCardPayment();

            expect(generator.next().value).toEqual(select(sagas.cardPaymentIdSelector));

            const result = generator.next(null);
            expect(result.done).toEqual(true);
          });
        });
      });
    });
  });
});
