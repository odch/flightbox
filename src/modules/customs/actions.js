
export const START_CUSTOMS = 'START_CUSTOMS';
export const START_CUSTOMS_SUCCESS = 'START_CUSTOMS_SUCCESS';
export const START_CUSTOMS_FAILURE = 'START_CUSTOMS_FAILURE';
export const SET_START_CUSTOMS_LOADING = 'SET_START_CUSTOMS_LOADING';

export const CHECK_CUSTOMS_AVAILABILITY = 'CHECK_CUSTOMS_AVAILABILITY';
export const SET_CUSTOMS_AVAILABILITY = 'SET_CUSTOMS_AVAILABILITY';


export const setStartCustomsLoading = () => ({
  type: SET_START_CUSTOMS_LOADING
})

export const setStartCustomsSuccess = () => ({
  type: START_CUSTOMS_SUCCESS
})

export const setStartCustomsFailure = (error) => ({
  type: START_CUSTOMS_FAILURE,
  payload: {
    error
  }
})

export const startCustoms = (movementData) => ({
  type: START_CUSTOMS,
  payload: {
    movementData
  }
})

export const checkCustomsAvailability = () => ({
  type: CHECK_CUSTOMS_AVAILABILITY
})

export const setCustomsAvailability = (available) => ({
  type: SET_CUSTOMS_AVAILABILITY,
  payload: {
    available
  }
})
