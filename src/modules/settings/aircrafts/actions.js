export const LOAD_AIRCRAFT_SETTINGS = 'LOAD_AIRCRAFT_SETTINGS';
export const LOAD_AIRCRAFT_SETTINGS_SUCCESS = 'LOAD_AIRCRAFT_SETTINGS_SUCCESS';
export const ADD_AIRCRAFT = 'ADD_AIRCRAFT';
export const ADD_AIRCRAFT_SUCCESS = 'ADD_AIRCRAFT_SUCCESS';
export const REMOVE_AIRCRAFT = 'REMOVE_AIRCRAFT';

export function loadAircraftSettings() {
  return {
    type: LOAD_AIRCRAFT_SETTINGS,
  };
}

export function loadAircraftSettingsSuccess(type, aircrafts) {
  return {
    type: LOAD_AIRCRAFT_SETTINGS_SUCCESS,
    payload: {
      type,
      aircrafts,
    },
  };
}

export function addAircraft(type, name) {
  return {
    type: ADD_AIRCRAFT,
    payload: {
      type,
      name,
    },
  };
}

export function addAircraftSuccess(type, name) {
  return {
    type: ADD_AIRCRAFT_SUCCESS,
    payload: {
      type,
      name,
    },
  };
}

export function removeAircraft(type, name) {
  return {
    type: REMOVE_AIRCRAFT,
    payload: {
      type,
      name,
    },
  };
}
