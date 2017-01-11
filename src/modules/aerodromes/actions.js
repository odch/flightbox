export const LOAD_AERODROMES = 'LOAD_AERODROMES';
export const SET_AERODROMES_LOADING = 'SET_AERODROMES_LOADING';
export const AERODROMES_LOADED = 'AERODROMES_LOADED';

export function loadAerodromes() {
  return {
    type: LOAD_AERODROMES,
  };
}

export function setAerodromesLoading() {
  return {
    type: SET_AERODROMES_LOADING,
  };
}

export function aerodromesLoaded(snapshot) {
  return {
    type: AERODROMES_LOADED,
    payload: {
      snapshot,
    },
  };
}
