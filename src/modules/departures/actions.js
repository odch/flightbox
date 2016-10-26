export const INIT_NEW_DEPARTURE = 'INIT_NEW_DEPARTURE';
export const SAVE_DEPARTURE = 'SAVE_DEPARTURE';
export const SAVE_DEPARTURE_SUCCESS = 'SAVE_DEPARTURE_SUCCESS';
export const EDIT_DEPARTURE = 'EDIT_DEPARTURE';

export function initNewDeparture() {
  return {
    type: INIT_NEW_DEPARTURE,
  };
}

export function saveDeparture() {
  return {
    type: SAVE_DEPARTURE,
  };
}

export function saveDepartureSuccess(key) {
  return {
    type: SAVE_DEPARTURE_SUCCESS,
    payload: {
      key,
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
