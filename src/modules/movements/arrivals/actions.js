export const LOAD_ARRIVALS = 'LOAD_ARRIVALS';
export const SET_ARRIVALS_LOADING = 'SET_ARRIVALS_LOADING';
export const ARRIVALS_ADDED = 'ARRIVALS_ADDED';

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
