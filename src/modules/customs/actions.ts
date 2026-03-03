export const START_CUSTOMS = 'START_CUSTOMS' as const;
export const START_CUSTOMS_SUCCESS = 'START_CUSTOMS_SUCCESS' as const;
export const START_CUSTOMS_FAILURE = 'START_CUSTOMS_FAILURE' as const;
export const SET_START_CUSTOMS_LOADING = 'SET_START_CUSTOMS_LOADING' as const;
export const CHECK_CUSTOMS_AVAILABILITY = 'CHECK_CUSTOMS_AVAILABILITY' as const;
export const SET_CUSTOMS_AVAILABILITY = 'SET_CUSTOMS_AVAILABILITY' as const;

export type CustomsAction =
  | { type: typeof START_CUSTOMS; payload: { movementData: unknown } }
  | { type: typeof START_CUSTOMS_SUCCESS }
  | { type: typeof START_CUSTOMS_FAILURE; payload: { error: string } }
  | { type: typeof SET_START_CUSTOMS_LOADING }
  | { type: typeof CHECK_CUSTOMS_AVAILABILITY }
  | { type: typeof SET_CUSTOMS_AVAILABILITY; payload: { available: boolean } };

export const setStartCustomsLoading = () => ({
  type: SET_START_CUSTOMS_LOADING
});

export const setStartCustomsSuccess = () => ({
  type: START_CUSTOMS_SUCCESS
});

export const setStartCustomsFailure = (error: string) => ({
  type: START_CUSTOMS_FAILURE,
  payload: {
    error
  }
});

export const startCustoms = (movementData: unknown) => ({
  type: START_CUSTOMS,
  payload: {
    movementData
  }
});

export const checkCustomsAvailability = () => ({
  type: CHECK_CUSTOMS_AVAILABILITY
});

export const setCustomsAvailability = (available: boolean) => ({
  type: SET_CUSTOMS_AVAILABILITY,
  payload: {
    available
  }
});
