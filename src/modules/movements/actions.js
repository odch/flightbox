export const LOAD_MOVEMENTS = 'LOAD_MOVEMENTS';
export const SET_MOVEMENTS_LOADING = 'SET_MOVEMENTS_LOADING';
export const LOAD_MOVEMENTS_FAILURE = 'LOAD_MOVEMENTS_FAILURE';
export const SET_MOVEMENTS = 'SET_MOVEMENTS';
export const MOVEMENT_ADDED = 'MOVEMENT_ADDED';
export const MOVEMENT_CHANGED = 'MOVEMENT_CHANGED';
export const MOVEMENT_DELETED = 'MOVEMENT_DELETED';
export const LOAD_MOVEMENT = 'LOAD_MOVEMENT';
export const ADD_MOVEMENT_BY_KEY = 'ADD_MOVEMENT_BY_KEY';
export const CLEAR_MOVEMENTS_BY_KEY = 'CLEAR_MOVEMENTS_BY_KEY';
export const DELETE_MOVEMENT = 'DELETE_MOVEMENT';
export const INIT_NEW_MOVEMENT = 'INIT_NEW_MOVEMENT';
export const INIT_NEW_MOVEMENT_FROM_MOVEMENT = 'INIT_NEW_MOVEMENT_FROM_MOVEMENT';
export const SAVE_MOVEMENT = 'SAVE_MOVEMENT';
export const SAVE_MOVEMENT_SUCCESS = 'SAVE_MOVEMENT_SUCCESS';
export const SAVE_MOVEMENT_FAILED = 'SAVE_MOVEMENT_FAILED';
export const EDIT_MOVEMENT = 'EDIT_MOVEMENT';
export const START_INITIALIZE_WIZARD = 'START_INITIALIZE_WIZARD';
export const WIZARD_INITIALIZED = 'WIZARD_INITIALIZED';
export const SET_MOVEMENTS_FILTER = 'SET_MOVEMENTS_FILTER';

export function loadMovements(clear) {
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

export function setMovements(movements) {
  return {
    type: SET_MOVEMENTS,
    payload: {
      movements
    },
  };
}

export function movementAdded(snapshot, movementType) {
  return {
    type: MOVEMENT_ADDED,
    payload: {
      snapshot,
      movementType
    },
  };
}

export function movementChanged(snapshot, movementType) {
  return {
    type: MOVEMENT_CHANGED,
    payload: {
      snapshot,
      movementType
    },
  };
}

export function movementDeleted(snapshot, movementType) {
  return {
    type: MOVEMENT_DELETED,
    payload: {
      snapshot,
      movementType
    },
  };
}

export function loadMovement(key, type) {
  return {
    type: LOAD_MOVEMENT,
    payload: {
      key,
      type
    }
  };
}

export function addMovementByKey(movement) {
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

export function deleteMovement(movementType, key, successAction) {
  return {
    type: DELETE_MOVEMENT,
    payload: {
      movementType,
      key,
      successAction,
    },
  };
}

export function initNewMovement(movementType) {
  return {
    type: INIT_NEW_MOVEMENT,
    payload: {
      movementType
    }
  };
}

export function initNewMovementFromMovement(movementType, sourceMovementType, sourceMovementKey) {
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

export function saveMovementSuccess(key, values) {
  return {
    type: SAVE_MOVEMENT_SUCCESS,
    payload: {
      key,
      values,
    },
  };
}

export function saveMovementFailed(error) {
  return {
    type: SAVE_MOVEMENT_FAILED,
    payload: {
      error,
    },
  };
}

export function editMovement(movementType, key) {
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

export function wizardInitialized() {
  return {
    type: WIZARD_INITIALIZED,
  };
}

export function setMovementsFilter(filter) {
  return {
    type: SET_MOVEMENTS_FILTER,
    payload: {
      filter
    }
  };
}
