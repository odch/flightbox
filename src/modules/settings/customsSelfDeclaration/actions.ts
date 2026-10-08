export const CUSTOMS_SELF_DECLARANTS_LOADED = 'CUSTOMS_SELF_DECLARANTS_LOADED' as const;
export const ADD_CUSTOMS_SELF_DECLARANT = 'ADD_CUSTOMS_SELF_DECLARANT' as const;
export const REMOVE_CUSTOMS_SELF_DECLARANT = 'REMOVE_CUSTOMS_SELF_DECLARANT' as const;
export const ADD_CUSTOMS_SELF_DECLARANT_AIRCRAFT = 'ADD_CUSTOMS_SELF_DECLARANT_AIRCRAFT' as const;
export const REMOVE_CUSTOMS_SELF_DECLARANT_AIRCRAFT = 'REMOVE_CUSTOMS_SELF_DECLARANT_AIRCRAFT' as const;
export const SAVE_CUSTOMS_SELF_DECLARANTS_SAVING = 'SAVE_CUSTOMS_SELF_DECLARANTS_SAVING' as const;
export const SAVE_CUSTOMS_SELF_DECLARANTS_SUCCESS = 'SAVE_CUSTOMS_SELF_DECLARANTS_SUCCESS' as const;
export const SAVE_CUSTOMS_SELF_DECLARANTS_FAILURE = 'SAVE_CUSTOMS_SELF_DECLARANTS_FAILURE' as const;

export type CustomsSelfDeclarationAction =
  | { type: typeof CUSTOMS_SELF_DECLARANTS_LOADED; payload: { value: unknown } }
  | { type: typeof ADD_CUSTOMS_SELF_DECLARANT; payload: { email: string } }
  | { type: typeof REMOVE_CUSTOMS_SELF_DECLARANT; payload: { email: string } }
  | { type: typeof ADD_CUSTOMS_SELF_DECLARANT_AIRCRAFT; payload: { email: string; registration: string } }
  | { type: typeof REMOVE_CUSTOMS_SELF_DECLARANT_AIRCRAFT; payload: { email: string; registration: string } }
  | { type: typeof SAVE_CUSTOMS_SELF_DECLARANTS_SAVING }
  | { type: typeof SAVE_CUSTOMS_SELF_DECLARANTS_SUCCESS }
  | { type: typeof SAVE_CUSTOMS_SELF_DECLARANTS_FAILURE };

// Receives the raw database value (or null when it does not exist or the
// admin signed out); the reducer normalises it.
export function customsSelfDeclarantsLoaded(value: unknown) {
  return {
    type: CUSTOMS_SELF_DECLARANTS_LOADED,
    payload: {
      value,
    },
  };
}

export function addCustomsSelfDeclarant(email: string) {
  return {
    type: ADD_CUSTOMS_SELF_DECLARANT,
    payload: {
      email,
    },
  };
}

export function removeCustomsSelfDeclarant(email: string) {
  return {
    type: REMOVE_CUSTOMS_SELF_DECLARANT,
    payload: {
      email,
    },
  };
}

export function addCustomsSelfDeclarantAircraft(email: string, registration: string) {
  return {
    type: ADD_CUSTOMS_SELF_DECLARANT_AIRCRAFT,
    payload: {
      email,
      registration,
    },
  };
}

export function removeCustomsSelfDeclarantAircraft(email: string, registration: string) {
  return {
    type: REMOVE_CUSTOMS_SELF_DECLARANT_AIRCRAFT,
    payload: {
      email,
      registration,
    },
  };
}

export function saveCustomsSelfDeclarantsSaving() {
  return {
    type: SAVE_CUSTOMS_SELF_DECLARANTS_SAVING,
  };
}

export function saveCustomsSelfDeclarantsSuccess() {
  return {
    type: SAVE_CUSTOMS_SELF_DECLARANTS_SUCCESS,
  };
}

export function saveCustomsSelfDeclarantsFailure() {
  return {
    type: SAVE_CUSTOMS_SELF_DECLARANTS_FAILURE,
  };
}
