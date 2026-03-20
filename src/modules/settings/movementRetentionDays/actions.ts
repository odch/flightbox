export const MOVEMENT_RETENTION_DAYS_LOADED = 'MOVEMENT_RETENTION_DAYS_LOADED' as const;
export const SET_MOVEMENT_RETENTION_DAYS = 'SET_MOVEMENT_RETENTION_DAYS' as const;
export const SET_MOVEMENT_RETENTION_DAYS_SAVING = 'SET_MOVEMENT_RETENTION_DAYS_SAVING' as const;
export const SET_MOVEMENT_RETENTION_DAYS_SUCCESS = 'SET_MOVEMENT_RETENTION_DAYS_SUCCESS' as const;

export type MovementRetentionDaysAction =
  | { type: typeof MOVEMENT_RETENTION_DAYS_LOADED; payload: { days: number | null } }
  | { type: typeof SET_MOVEMENT_RETENTION_DAYS; payload: { days: number | null } }
  | { type: typeof SET_MOVEMENT_RETENTION_DAYS_SAVING }
  | { type: typeof SET_MOVEMENT_RETENTION_DAYS_SUCCESS };

export function movementRetentionDaysLoaded(days: number | null) {
  return {
    type: MOVEMENT_RETENTION_DAYS_LOADED,
    payload: {
      days,
    },
  };
}

export function setMovementRetentionDays(days: number | null) {
  return {
    type: SET_MOVEMENT_RETENTION_DAYS,
    payload: {
      days,
    },
  };
}

export function setMovementRetentionDaysSaving() {
  return {
    type: SET_MOVEMENT_RETENTION_DAYS_SAVING,
  };
}

export function setMovementRetentionDaysSuccess() {
  return {
    type: SET_MOVEMENT_RETENTION_DAYS_SUCCESS,
  };
}
