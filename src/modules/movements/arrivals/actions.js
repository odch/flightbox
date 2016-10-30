export const LOAD_ARRIVALS = 'LOAD_ARRIVALS';
export const SET_ARRIVALS_LOADING = 'SET_ARRIVALS_LOADING';
export const ARRIVALS_ADDED = 'ARRIVALS_ADDED';
export const DELETE_ARRIVAL = 'DELETE_ARRIVAL';
export const INIT_NEW_ARRIVAL = 'INIT_NEW_ARRIVAL';
export const SAVE_ARRIVAL = 'SAVE_ARRIVAL';
export const SAVE_ARRIVAL_SUCCESS = 'SAVE_ARRIVAL_SUCCESS';
export const EDIT_ARRIVAL = 'EDIT_ARRIVAL';

export function loadArrivals() {
  return {
    type: LOAD_ARRIVALS,
  };
}

export function setArrivalsLoading() {
  return {
    type: SET_ARRIVALS_LOADING,
  };
}

export function arrivalsAdded(snapshot) {
  return {
    type: ARRIVALS_ADDED,
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

export function saveArrival() {
  return {
    type: SAVE_ARRIVAL,
  };
}

export function saveArrivalSuccess(key) {
  return {
    type: SAVE_ARRIVAL_SUCCESS,
    payload: {
      key,
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
