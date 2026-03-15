export const LOAD_AIRCRAFT_SETTINGS = 'LOAD_AIRCRAFT_SETTINGS' as const;
export const LOAD_AIRCRAFT_SETTINGS_SUCCESS = 'LOAD_AIRCRAFT_SETTINGS_SUCCESS' as const;
export const ADD_AIRCRAFT = 'ADD_AIRCRAFT' as const;
export const ADD_AIRCRAFT_SUCCESS = 'ADD_AIRCRAFT_SUCCESS' as const;
export const REMOVE_AIRCRAFT = 'REMOVE_AIRCRAFT' as const;

export type SettingsAircraftsAction =
  | { type: typeof LOAD_AIRCRAFT_SETTINGS }
  | { type: typeof LOAD_AIRCRAFT_SETTINGS_SUCCESS; payload: { type: string; aircrafts: Record<string, boolean> } }
  | { type: typeof ADD_AIRCRAFT; payload: { type: string; name: string } }
  | { type: typeof ADD_AIRCRAFT_SUCCESS; payload: { type: string; name: string } }
  | { type: typeof REMOVE_AIRCRAFT; payload: { type: string; name: string } };

export function loadAircraftSettings() {
  return {
    type: LOAD_AIRCRAFT_SETTINGS,
  };
}

export function loadAircraftSettingsSuccess(type: string, aircrafts: Record<string, boolean>) {
  return {
    type: LOAD_AIRCRAFT_SETTINGS_SUCCESS,
    payload: {
      type,
      aircrafts,
    },
  };
}

export function addAircraft(type: string, name: string) {
  return {
    type: ADD_AIRCRAFT,
    payload: {
      type,
      name,
    },
  };
}

export function addAircraftSuccess(type: string, name: string) {
  return {
    type: ADD_AIRCRAFT_SUCCESS,
    payload: {
      type,
      name,
    },
  };
}

export function removeAircraft(type: string, name: string) {
  return {
    type: REMOVE_AIRCRAFT,
    payload: {
      type,
      name,
    },
  };
}
