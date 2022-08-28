export const SHOW_DELETE_CONFIRMATION_DIALOG = 'SHOW_DELETE_CONFIRMATION_DIALOG';
export const HIDE_DELETE_CONFIRMATION_DIALOG = 'HIDE_DELETE_CONFIRMATION_DIALOG';
export const SHOW_MOVEMENT_WIZARD = 'SHOW_MOVEMENT_WIZARD';
export const CREATE_MOVEMENT_FROM_MOVEMENT = 'CREATE_MOVEMENT_FROM_MOVEMENT';
export const CANCEL_WIZARD = 'CANCEL_WIZARD';
export const SELECT_MOVEMENT = 'SELECT_MOVEMENT';
export const SET_MOVEMENTS_FILTER_EXPANDED = 'SET_MOVEMENTS_FILTER_EXPANDED';

export function showDeleteConfirmationDialog(item) {
  return {
    type: SHOW_DELETE_CONFIRMATION_DIALOG,
    payload: {
      item,
    },
  };
}

export function hideDeleteConfirmationDialog() {
  return {
    type: HIDE_DELETE_CONFIRMATION_DIALOG,
  };
}

export function showMovementWizard(movementType, key) {
  return {
    type: SHOW_MOVEMENT_WIZARD,
    payload: {
      movementType,
      key,
    },
  };
}

export function createMovementFromMovement(sourceMovementType, sourceMovementKey) {
  return {
    type: CREATE_MOVEMENT_FROM_MOVEMENT,
    payload: {
      sourceMovementType,
      sourceMovementKey
    },
  };
}

export function cancelWizard() {
  return {
    type: CANCEL_WIZARD,
  }
}

export function selectMovement(key) {
  return {
    type: SELECT_MOVEMENT,
    payload: {
      key,
    }
  }
}

export function setMovementsFilterExpanded(expanded) {
  return {
    type: SET_MOVEMENTS_FILTER_EXPANDED,
    payload: {
      expanded,
    }
  }
}
