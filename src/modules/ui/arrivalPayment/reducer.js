import * as actions from './actions';
import reducer from '../../../util/reducer';

export const Step = {
  OPTIONS: 'options',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed'
}

const INITIAL_STATE = {
  method: null,
  step: Step.OPTIONS,
  failure: false
};

const reset = () => ({
  ...INITIAL_STATE
})

const setMethod = (state, action) => ({
  ...state,
  method: action.payload.method,
  failure: false
})

const setStep = (state, action) => ({
  ...state,
  step: action.payload.step
})

const setFailure = (state) => ({
  ...state,
  failure: true
})

const ACTION_HANDLERS = {
  [actions.ARRIVAL_PAYMENT_SET_METHOD]: setMethod,
  [actions.ARRIVAL_PAYMENT_SET_STEP]: setStep,
  [actions.ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE]: setFailure,
  [actions.ARRIVAL_PAYMENT_RESET]: reset,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
