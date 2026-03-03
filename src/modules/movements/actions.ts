export const LOAD_MOVEMENTS = 'LOAD_MOVEMENTS' as const;
export const SET_MOVEMENTS_LOADING = 'SET_MOVEMENTS_LOADING' as const;
export const LOAD_MOVEMENTS_FAILURE = 'LOAD_MOVEMENTS_FAILURE' as const;
export const SET_MOVEMENTS = 'SET_MOVEMENTS' as const;
export const MOVEMENT_ADDED = 'MOVEMENT_ADDED' as const;
export const MOVEMENT_CHANGED = 'MOVEMENT_CHANGED' as const;
export const MOVEMENT_DELETED = 'MOVEMENT_DELETED' as const;
export const LOAD_MOVEMENT = 'LOAD_MOVEMENT' as const;
export const ADD_MOVEMENT_BY_KEY = 'ADD_MOVEMENT_BY_KEY' as const;
export const CLEAR_MOVEMENTS_BY_KEY = 'CLEAR_MOVEMENTS_BY_KEY' as const;
export const DELETE_MOVEMENT = 'DELETE_MOVEMENT' as const;
export const INIT_NEW_MOVEMENT = 'INIT_NEW_MOVEMENT' as const;
export const INIT_NEW_MOVEMENT_FROM_MOVEMENT = 'INIT_NEW_MOVEMENT_FROM_MOVEMENT' as const;
export const SAVE_MOVEMENT = 'SAVE_MOVEMENT' as const;
export const SAVE_MOVEMENT_SUCCESS = 'SAVE_MOVEMENT_SUCCESS' as const;
export const SAVE_MOVEMENT_FAILED = 'SAVE_MOVEMENT_FAILED' as const;
export const SAVE_MOVEMENT_PAYMENT_METHOD = 'SAVE_MOVEMENT_PAYMENT_METHOD' as const;
export const EDIT_MOVEMENT = 'EDIT_MOVEMENT' as const;
export const START_INITIALIZE_WIZARD = 'START_INITIALIZE_WIZARD' as const;
export const WIZARD_INITIALIZED = 'WIZARD_INITIALIZED' as const;
export const SET_MOVEMENTS_FILTER = 'SET_MOVEMENTS_FILTER' as const;
export const SET_ASSOCIATED_MOVEMENT = 'SET_ASSOCIATED_MOVEMENT' as const;
export const CLEAR_ASSOCIATED_MOVEMENTS = 'CLEAR_ASSOCIATED_MOVEMENTS' as const;

export type MovementsAction =
  | { type: typeof LOAD_MOVEMENTS; payload: { clear: boolean } }
  | { type: typeof SET_MOVEMENTS_LOADING }
  | { type: typeof LOAD_MOVEMENTS_FAILURE }
  | { type: typeof SET_MOVEMENTS; payload: { movements: unknown } }
  | { type: typeof MOVEMENT_ADDED; payload: { snapshot: unknown; movementType: string } }
  | { type: typeof MOVEMENT_CHANGED; payload: { snapshot: unknown; movementType: string } }
  | { type: typeof MOVEMENT_DELETED; payload: { snapshot: unknown; movementType: string } }
  | { type: typeof LOAD_MOVEMENT; payload: { key: string; type: string } }
  | { type: typeof ADD_MOVEMENT_BY_KEY; payload: { movement: unknown } }
  | { type: typeof CLEAR_MOVEMENTS_BY_KEY }
  | { type: typeof DELETE_MOVEMENT; payload: { movementType: string; key: string; successAction: () => unknown } }
  | { type: typeof INIT_NEW_MOVEMENT; payload: { movementType: string } }
  | { type: typeof INIT_NEW_MOVEMENT_FROM_MOVEMENT; payload: { movementType: string; sourceMovementType: string; sourceMovementKey: string } }
  | { type: typeof SAVE_MOVEMENT }
  | { type: typeof SAVE_MOVEMENT_SUCCESS; payload: { key: string; values: unknown } }
  | { type: typeof SAVE_MOVEMENT_FAILED; payload: { error: unknown } }
  | { type: typeof SAVE_MOVEMENT_PAYMENT_METHOD; payload: { movementType: string; key: string; paymentMethod: string } }
  | { type: typeof EDIT_MOVEMENT; payload: { movementType: string; key: string } }
  | { type: typeof START_INITIALIZE_WIZARD }
  | { type: typeof WIZARD_INITIALIZED; payload: { values: Record<string, unknown> } }
  | { type: typeof SET_MOVEMENTS_FILTER; payload: { filter: unknown } }
  | { type: typeof SET_ASSOCIATED_MOVEMENT; payload: { movementType: string; movementKey: string; associatedMovement: unknown } }
  | { type: typeof CLEAR_ASSOCIATED_MOVEMENTS };

export function loadMovements(clear: boolean) {
  return {
    type: LOAD_MOVEMENTS,
    payload: {
      clear
    }
  };
}

export function setMovementsLoading() {
  return {
    type: SET_MOVEMENTS_LOADING,
  };
}

export function loadMovementsFailure() {
  return {
    type: LOAD_MOVEMENTS_FAILURE,
  };
}

export function setMovements(movements: unknown) {
  return {
    type: SET_MOVEMENTS,
    payload: {
      movements
    },
  };
}

export function movementAdded(snapshot: unknown, movementType: string) {
  return {
    type: MOVEMENT_ADDED,
    payload: {
      snapshot,
      movementType
    },
  };
}

export function movementChanged(snapshot: unknown, movementType: string) {
  return {
    type: MOVEMENT_CHANGED,
    payload: {
      snapshot,
      movementType
    },
  };
}

export function movementDeleted(snapshot: unknown, movementType: string) {
  return {
    type: MOVEMENT_DELETED,
    payload: {
      snapshot,
      movementType
    },
  };
}

export function loadMovement(key: string, type: string) {
  return {
    type: LOAD_MOVEMENT,
    payload: {
      key,
      type
    }
  };
}

export function addMovementByKey(movement: unknown) {
  return {
    type: ADD_MOVEMENT_BY_KEY,
    payload: {
      movement
    }
  };
}

export function clearMovementsByKey() {
  return {
    type: CLEAR_MOVEMENTS_BY_KEY
  };
}

export function deleteMovement(movementType: string, key: string, successAction: () => unknown) {
  return {
    type: DELETE_MOVEMENT,
    payload: {
      movementType,
      key,
      successAction,
    },
  };
}

export function initNewMovement(movementType: string) {
  return {
    type: INIT_NEW_MOVEMENT,
    payload: {
      movementType
    }
  };
}

export function initNewMovementFromMovement(movementType: string, sourceMovementType: string, sourceMovementKey: string) {
  return {
    type: INIT_NEW_MOVEMENT_FROM_MOVEMENT,
    payload: {
      movementType,
      sourceMovementType,
      sourceMovementKey
    },
  };
}

export function saveMovement() {
  return {
    type: SAVE_MOVEMENT,
  };
}

export function saveMovementSuccess(key: string, values: unknown) {
  return {
    type: SAVE_MOVEMENT_SUCCESS,
    payload: {
      key,
      values,
    },
  };
}

export function saveMovementFailed(error: unknown) {
  return {
    type: SAVE_MOVEMENT_FAILED,
    payload: {
      error,
    },
  };
}

export function saveMovementPaymentMethod(movementType: string, key: string, paymentMethod: string) {
  return {
    type: SAVE_MOVEMENT_PAYMENT_METHOD,
    payload: {
      movementType,
      key,
      paymentMethod,
    },
  };
}

export function editMovement(movementType: string, key: string) {
  return {
    type: EDIT_MOVEMENT,
    payload: {
      movementType,
      key,
    },
  };
}

export function startInitializeWizard() {
  return {
    type: START_INITIALIZE_WIZARD,
  };
}

export function wizardInitialized(values: Record<string, unknown>) {
  return {
    type: WIZARD_INITIALIZED,
    payload: {
      values
    }
  };
}

export function setMovementsFilter(filter: unknown) {
  return {
    type: SET_MOVEMENTS_FILTER,
    payload: {
      filter
    }
  };
}

export function setAssociatedMovement(movementType: string, movementKey: string, associatedMovement: unknown) {
  return {
    type: SET_ASSOCIATED_MOVEMENT,
    payload: {
      movementType,
      movementKey,
      associatedMovement
    }
  };
}

export function clearAssociatedMovements() {
  return {
    type: CLEAR_ASSOCIATED_MOVEMENTS
  };
}
