export const SHOW_DELETE_CONFIRMATION_DIALOG = 'SHOW_DELETE_CONFIRMATION_DIALOG' as const;
export const HIDE_DELETE_CONFIRMATION_DIALOG = 'HIDE_DELETE_CONFIRMATION_DIALOG' as const;
export const SHOW_MOVEMENT_WIZARD = 'SHOW_MOVEMENT_WIZARD' as const;
export const CREATE_MOVEMENT_FROM_MOVEMENT = 'CREATE_MOVEMENT_FROM_MOVEMENT' as const;
export const CANCEL_WIZARD = 'CANCEL_WIZARD' as const;
export const SELECT_MOVEMENT = 'SELECT_MOVEMENT' as const;
export const SET_MOVEMENTS_FILTER_EXPANDED = 'SET_MOVEMENTS_FILTER_EXPANDED' as const;

export type UiMovementsAction =
  | { type: typeof SHOW_DELETE_CONFIRMATION_DIALOG; payload: { item: unknown } }
  | { type: typeof HIDE_DELETE_CONFIRMATION_DIALOG }
  | { type: typeof SHOW_MOVEMENT_WIZARD; payload: { movementType: string; key: string } }
  | { type: typeof CREATE_MOVEMENT_FROM_MOVEMENT; payload: { sourceMovementType: string; sourceMovementKey: string } }
  | { type: typeof CANCEL_WIZARD }
  | { type: typeof SELECT_MOVEMENT; payload: { key: string } }
  | { type: typeof SET_MOVEMENTS_FILTER_EXPANDED; payload: { expanded: boolean } };

export function showDeleteConfirmationDialog(item: unknown) {
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

export function showMovementWizard(movementType: string, key: string) {
  return {
    type: SHOW_MOVEMENT_WIZARD,
    payload: {
      movementType,
      key,
    },
  };
}

export function createMovementFromMovement(sourceMovementType: string, sourceMovementKey: string) {
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

export function selectMovement(key: string) {
  return {
    type: SELECT_MOVEMENT,
    payload: {
      key,
    }
  }
}

export function setMovementsFilterExpanded(expanded: boolean) {
  return {
    type: SET_MOVEMENTS_FILTER_EXPANDED,
    payload: {
      expanded,
    }
  }
}
