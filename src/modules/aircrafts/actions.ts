export const LOAD_AIRCRAFTS = 'LOAD_AIRCRAFTS' as const;
export const SET_AIRCRAFTS_LOADING = 'SET_AIRCRAFTS_LOADING' as const;
export const AIRCRAFTS_LOADED = 'AIRCRAFTS_LOADED' as const;

export type AircraftsAction =
  | { type: typeof LOAD_AIRCRAFTS }
  | { type: typeof SET_AIRCRAFTS_LOADING }
  | { type: typeof AIRCRAFTS_LOADED; payload: { snapshot: unknown } };

export function loadAircrafts() {
  return {
    type: LOAD_AIRCRAFTS,
  };
}

export function setAircraftsLoading() {
  return {
    type: SET_AIRCRAFTS_LOADING,
  };
}

export function aircraftsLoaded(snapshot: unknown) {
  return {
    type: AIRCRAFTS_LOADED,
    payload: {
      snapshot,
    },
  };
}
