export const ARRIVAL_PAYMENT_SET_METHOD = 'ARRIVAL_PAYMENT_SET_METHOD' as const;
export const ARRIVAL_PAYMENT_SET_STEP = 'ARRIVAL_PAYMENT_SET_STEP' as const;
export const ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT = 'ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT' as const;
export const ARRIVAL_PAYMENT_SET_CARD_PAYMENT_ID = 'ARRIVAL_PAYMENT_SET_CARD_PAYMENT_ID' as const;
export const ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE = 'ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE' as const;
export const ARRIVAL_PAYMENT_CANCEL_CARD_PAYMENT = 'ARRIVAL_PAYMENT_CANCEL_CARD_PAYMENT' as const;
export const ARRIVAL_PAYMENT_RESET = 'ARRIVAL_PAYMENT_RESET' as const;

export type ArrivalPaymentAction =
  | { type: typeof ARRIVAL_PAYMENT_SET_METHOD; payload: { method: string | null } }
  | { type: typeof ARRIVAL_PAYMENT_SET_STEP; payload: { step: string } }
  | { type: typeof ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT; payload: Record<string, unknown> }
  | { type: typeof ARRIVAL_PAYMENT_SET_CARD_PAYMENT_ID; payload: { id: string } }
  | { type: typeof ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE }
  | { type: typeof ARRIVAL_PAYMENT_CANCEL_CARD_PAYMENT }
  | { type: typeof ARRIVAL_PAYMENT_RESET };

export const setMethod = (method: string | null) => ({
  type: ARRIVAL_PAYMENT_SET_METHOD,
  payload: {
    method
  }
});

export const setStep = (step: string) => ({
  type: ARRIVAL_PAYMENT_SET_STEP,
  payload: {
    step
  }
});

export const createCardPayment = (
  movementKey: string,
  refNr: string,
  amount: number,
  currency: string,
  method: string,
  email: string,
  immatriculation: string,
  landings: number,
  landingFeeSingle: number,
  landingFeeCode: string | null,
  landingFeeTotal: number,
  goArounds: number,
  goAroundFeeSingle: number,
  goAroundFeeCode: string | null,
  goAroundFeeTotal: number
) => ({
  type: ARRIVAL_PAYMENT_CREATE_CARD_PAYMENT,
  payload: {
    movementKey,
    refNr,
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
});

export const setCardPaymentId = (id: string) => ({
  type: ARRIVAL_PAYMENT_SET_CARD_PAYMENT_ID,
  payload: {
    id
  }
});

export const cardPaymentFailure = () => ({
  type: ARRIVAL_PAYMENT_CARD_PAYMENT_FAILURE
});

export const cancelCardPayment = () => ({
  type: ARRIVAL_PAYMENT_CANCEL_CARD_PAYMENT
});

export const reset = () => ({
  type: ARRIVAL_PAYMENT_RESET
});
