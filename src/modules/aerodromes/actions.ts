export const LOAD_AERODROMES = 'LOAD_AERODROMES' as const;
export const SET_AERODROMES_LOADING = 'SET_AERODROMES_LOADING' as const;
export const AERODROMES_LOADED = 'AERODROMES_LOADED' as const;

export type AerodromesAction =
  | { type: typeof LOAD_AERODROMES }
  | { type: typeof SET_AERODROMES_LOADING }
  | { type: typeof AERODROMES_LOADED; payload: { snapshot: unknown } };

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

export function aerodromesLoaded(snapshot: unknown) {
  return {
    type: AERODROMES_LOADED,
    payload: {
      snapshot,
    },
  };
}
