export const LOAD_FREQUENT_AERODROMES = 'LOAD_FREQUENT_AERODROMES' as const;
export const FREQUENT_AERODROMES_LOADED = 'FREQUENT_AERODROMES_LOADED' as const;

export type FrequentAerodromesAction =
  | { type: typeof LOAD_FREQUENT_AERODROMES }
  | { type: typeof FREQUENT_AERODROMES_LOADED; payload: { data: string[] } };

export function loadFrequentAerodromes() {
  return {
    type: LOAD_FREQUENT_AERODROMES,
  };
}

export function frequentAerodromesLoaded(data: string[]) {
  return {
    type: FREQUENT_AERODROMES_LOADED,
    payload: { data },
  };
}
