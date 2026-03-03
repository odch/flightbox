import * as actions from './actions';
import { ArrivalPaymentAction } from './actions';
import reducer from '../../../util/reducer';

export const Step = {
  OPTIONS: 'options',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed'
};

interface ArrivalPaymentState {
  method: string | null;
  step: string;
  failure: boolean;
  cardPaymentId: string | null;
}

const INITIAL_STATE: ArrivalPaymentState = {
  method: null,
  step: Step.OPTIONS,
  failure: false,
  cardPaymentId: null
};

const reset = (): ArrivalPaymentState => ({
  ...INITIAL_STATE
});

const setMethod = (state: ArrivalPaymentState, action: ArrivalPaymentAction & { type: typeof actions.ARRIVAL_PAYMENT_SET_METHOD }) => ({
  ...state,
  method: action.payload.method,
  failure: false
});

const setStep = (state: ArrivalPaymentState, action: ArrivalPaymentAction & { type: typeof actions.ARRIVAL_PAYMENT_SET_STEP }) => ({
  ...state,
  step: action.payload.step
});

const setCardPaymentId = (state: ArrivalPaymentState, action: ArrivalPaymentAction & { type: typeof actions.ARRIVAL_PAYMENT_SET_CARD_PAYMENT_ID }) => ({
  ...state,
  cardPaymentId: action.payload.id
});

const setFailure = (state: ArrivalPaymentState) => ({
  ...state,
  failure: true
});

const ACTION_HANDLERS = {
  [actions.ARRIVAL_PAYMENT_SET_METHOD]: setMethod,
  [actions.ARRIVAL_PAYMENT_SET_STEP]: setStep,
  [actions.ARRIVAL_PAYMENT_SET_CARD_PAYMENT_ID]: setCardPaymentId,
  [actions.ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE]: setFailure,
  [actions.ARRIVAL_PAYMENT_RESET]: reset,
};

export type { ArrivalPaymentState };
export default reducer<ArrivalPaymentState, ArrivalPaymentAction>(INITIAL_STATE, ACTION_HANDLERS);
