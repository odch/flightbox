export const LOAD_AIRCRAFTS = 'LOAD_AIRCRAFTS';
export const SET_AIRCRAFTS_LOADING = 'SET_AIRCRAFTS_LOADING';
export const AIRCRAFTS_LOADED = 'AIRCRAFTS_LOADED';

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

export function aircraftsLoaded(snapshot) {
  return {
    type: AIRCRAFTS_LOADED,
    payload: {
      snapshot,
    },
  };
}
