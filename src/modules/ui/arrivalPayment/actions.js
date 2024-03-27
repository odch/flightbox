export const ARRIVAL_PAYMENT_SET_METHOD = 'ARRIVAL_PAYMENT_SET_METHOD';
export const ARRIVAL_PAYMENT_SET_STEP = 'ARRIVAL_PAYMENT_SET_STEP';
export const ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT = 'ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT';
export const ARRIVAL_PAYMENT_SET_CARD_PAYMENT_ID = 'ARRIVAL_PAYMENT_SET_CARD_PAYMENT_ID';
export const ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE = 'ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE';
export const ARRIVAL_PAYMENT_CANCEL_CARD_PAYMENT = 'ARRIVAL_PAYMENT_CANCEL_CARD_PAYMENT';
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

export const createCardPayment = (
  movementKey,
  amount,
  currency,
  method,
  email,
  immatriculation,
  landings,
  landingFeeSingle,
  landingFeeCode,
  landingFeeTotal,
  goArounds,
  goAroundFeeSingle,
  goAroundFeeCode,
  goAroundFeeTotal
) => ({
  type: ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT,
  payload: {
    movementKey,
    amount,
    currency,
    method,
    email,
    immatriculation,
    landings,
    landingFeeSingle,
    landingFeeCode,
    landingFeeTotal,
    goArounds,
    goAroundFeeSingle,
    goAroundFeeCode,
    goAroundFeeTotal
  }
})

export const setCardPaymentId = id => ({
  type: ARRIVAL_PAYMENT_SET_CARD_PAYMENT_ID,
  payload: {
    id
  }
})

export const cardPaymentFailure = () => ({
  type: ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE
})

export const cancelCardPayment = () => ({
  type: ARRIVAL_PAYMENT_CANCEL_CARD_PAYMENT
})

export const reset = () => ({
  type: ARRIVAL_PAYMENT_RESET
})
