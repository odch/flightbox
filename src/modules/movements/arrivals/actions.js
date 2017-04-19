export const LOAD_ARRIVALS = 'LOAD_ARRIVALS';
export const MONITOR_ARRIVALS = 'MONITOR_ARRIVALS';
export const SET_ARRIVALS_LOADING = 'SET_ARRIVALS_LOADING';
export const LOAD_ARRIVALS_FAILURE = 'LOAD_ARRIVALS_FAILURE';
export const ARRIVALS_ADDED = 'ARRIVALS_ADDED';
export const ARRIVAL_ADDED = 'ARRIVAL_ADDED';
export const ARRIVAL_CHANGED = 'ARRIVAL_CHANGED';
export const ARRIVAL_DELETED = 'ARRIVAL_DELETED';
export const DELETE_ARRIVAL = 'DELETE_ARRIVAL';
export const INIT_NEW_ARRIVAL = 'INIT_NEW_ARRIVAL';
export const INIT_NEW_ARRIVAL_FROM_DEPARTURE = 'INIT_NEW_ARRIVAL_FROM_DEPARTURE';
export const SAVE_ARRIVAL = 'SAVE_ARRIVAL';
export const SAVE_ARRIVAL_SUCCESS = 'SAVE_ARRIVAL_SUCCESS';
export const SAVE_ARRIVAL_FAILED = 'SAVE_ARRIVAL_FAILED';
export const EDIT_ARRIVAL = 'EDIT_ARRIVAL';

export function loadArrivals() {
  return {
    type: LOAD_ARRIVALS,
  };
}

export function monitorArrivals() {
  return {
    type: MONITOR_ARRIVALS,
  };
}

export function setArrivalsLoading() {
  return {
    type: SET_ARRIVALS_LOADING,
  };
}

export function loadArrivalsFailure() {
  return {
    type: LOAD_ARRIVALS_FAILURE,
  };
}

export function arrivalsAdded(snapshot, ref) {
  return {
    type: ARRIVALS_ADDED,
    payload: {
      snapshot,
      ref
    },
  };
}

export function arrivalAdded(snapshot) {
  return {
    type: ARRIVAL_ADDED,
    payload: {
      snapshot,
    },
  };
}

export function arrivalChanged(snapshot) {
  return {
    type: ARRIVAL_CHANGED,
    payload: {
      snapshot,
    },
  };
}

export function arrivalDeleted(snapshot) {
  return {
    type: ARRIVAL_DELETED,
    payload: {
      snapshot,
    },
  };
}

export function deleteArrival(key, successAction) {
  return {
    type: DELETE_ARRIVAL,
    payload: {
      key,
      successAction,
    },
  };
}

export function initNewArrival() {
  return {
    type: INIT_NEW_ARRIVAL,
  };
}

export function initNewArrivalFromDeparture(departureKey) {
  return {
    type: INIT_NEW_ARRIVAL_FROM_DEPARTURE,
    payload: {
      departureKey,
    },
  };
}

export function saveArrival() {
  return {
    type: SAVE_ARRIVAL,
  };
}

export function saveArrivalSuccess(key, values) {
  return {
    type: SAVE_ARRIVAL_SUCCESS,
    payload: {
      key,
      values,
    },
  };
}

export function saveArrivalFailed(error) {
  return {
    type: SAVE_ARRIVAL_FAILED,
    payload: {
      error,
    },
  };
}

export function editArrival(key) {
  return {
    type: EDIT_ARRIVAL,
    payload: {
      key,
    },
  };
}
