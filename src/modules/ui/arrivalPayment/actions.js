export const ARRIVAL_PAYMENT_SET_METHOD = 'ARRIVAL_PAYMENT_SET_METHOD';
export const ARRIVAL_PAYMENT_SET_STEP = 'ARRIVAL_PAYMENT_SET_STEP';
export const ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT = 'ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT';
export const ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE = 'ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE';
export const ARRIVAL_PAYMENT_RESET = 'ARRIVAL_PAYMENT_RESET';

export const setMethod = method => ({
  type: ARRIVAL_PAYMENT_SET_METHOD,
  payload: {
    method
  }
})

export const setStep = step => ({
  type: ARRIVAL_PAYMENT_SET_STEP,
  payload: {
    step
  }
})

export const createCardPayment = (movementKey, amount, currency) => ({
  type: ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT,
  payload: {
    movementKey,
    amount,
    currency
  }
})

export const cardPaymentFailure = () => ({
  type: ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE
})

export const reset = () => ({
  type: ARRIVAL_PAYMENT_RESET
})
