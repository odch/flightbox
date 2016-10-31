export const LOAD_AIRCRAFT_SETTINGS = 'LOAD_AIRCRAFT_SETTINGS';
export const LOAD_AIRCRAFT_SETTINGS_SUCCESS = 'LOAD_AIRCRAFT_SETTINGS_SUCCESS';

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
