export const LOAD_DEPARTURES = 'LOAD_DEPARTURES';
export const MONITOR_DEPARTURES = 'MONITOR_DEPARTURES';
export const SET_DEPARTURES_LOADING = 'SET_DEPARTURES_LOADING';
export const LOAD_DEPARTURES_FAILURE = 'LOAD_DEPARTURES_FAILURE';
export const DEPARTURES_ADDED = 'DEPARTURES_ADDED';
export const DEPARTURE_ADDED = 'DEPARTURE_ADDED';
export const DEPARTURE_CHANGED = 'DEPARTURE_CHANGED';
export const DEPARTURE_DELETED = 'DEPARTURE_DELETED';
export const DELETE_DEPARTURE = 'DELETE_DEPARTURE';
export const INIT_NEW_DEPARTURE = 'INIT_NEW_DEPARTURE';
export const INIT_NEW_DEPARTURE_FROM_ARRIVAL = 'INIT_NEW_DEPARTURE_FROM_ARRIVAL';
export const SAVE_DEPARTURE = 'SAVE_DEPARTURE';
export const SAVE_DEPARTURE_SUCCESS = 'SAVE_DEPARTURE_SUCCESS';
export const SAVE_DEPARTURE_FAILED = 'SAVE_DEPARTURE_FAILED';
export const EDIT_DEPARTURE = 'EDIT_DEPARTURE';

export function loadDepartures() {
  return {
    type: LOAD_DEPARTURES,
  };
}

export function monitorDepartures() {
  return {
    type: MONITOR_DEPARTURES,
  };
}

export function setDeparturesLoading() {
  return {
    type: SET_DEPARTURES_LOADING,
  };
}

export function loadDeparturesFailure() {
  return {
    type: LOAD_DEPARTURES_FAILURE,
  };
}

export function departuresAdded(snapshot, ref) {
  return {
    type: DEPARTURES_ADDED,
    payload: {
      snapshot,
      ref
    },
  };
}

export function departureAdded(snapshot) {
  return {
    type: DEPARTURE_ADDED,
    payload: {
      snapshot,
    },
  };
}

export function departureChanged(snapshot) {
  return {
    type: DEPARTURE_CHANGED,
    payload: {
      snapshot,
    },
  };
}

export function departureDeleted(snapshot) {
  return {
    type: DEPARTURE_DELETED,
    payload: {
      snapshot,
    },
  };
}

export function deleteDeparture(key, successAction) {
  return {
    type: DELETE_DEPARTURE,
    payload: {
      key,
      successAction,
    },
  };
}

export function initNewDeparture() {
  return {
    type: INIT_NEW_DEPARTURE,
  };
}

export function initNewDepartureFromArrival(arrivalKey) {
  return {
    type: INIT_NEW_DEPARTURE_FROM_ARRIVAL,
    payload: {
      arrivalKey,
    },
  };
}

export function saveDeparture() {
  return {
    type: SAVE_DEPARTURE,
  };
}

export function saveDepartureSuccess(key, values) {
  return {
    type: SAVE_DEPARTURE_SUCCESS,
    payload: {
      key,
      values,
    },
  };
}

export function saveDepartureFailed(error) {
  return {
    type: SAVE_DEPARTURE_FAILED,
    payload: {
      error,
    },
  };
}

export function editDeparture(key) {
  return {
    type: EDIT_DEPARTURE,
    payload: {
      key,
    },
  };
}
