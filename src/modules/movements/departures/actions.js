export const LOAD_DEPARTURES = 'LOAD_DEPARTURES';
export const SET_DEPARTURES_LOADING = 'SET_DEPARTURES_LOADING';
export const DEPARTURES_ADDED = 'DEPARTURES_ADDED';

export function loadDepartures() {
  return {
    type: LOAD_DEPARTURES,
  };
}

export function setDeparturesLoading() {
  return {
    type: SET_DEPARTURES_LOADING,
  };
}

export function departuresAdded(snapshot) {
  return {
    type: DEPARTURES_ADDED,
    payload: {
      snapshot,
    },
  };
}
