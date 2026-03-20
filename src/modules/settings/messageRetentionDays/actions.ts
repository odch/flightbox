export const MESSAGE_RETENTION_DAYS_LOADED = 'MESSAGE_RETENTION_DAYS_LOADED' as const;
export const SET_MESSAGE_RETENTION_DAYS = 'SET_MESSAGE_RETENTION_DAYS' as const;
export const SET_MESSAGE_RETENTION_DAYS_SAVING = 'SET_MESSAGE_RETENTION_DAYS_SAVING' as const;
export const SET_MESSAGE_RETENTION_DAYS_SUCCESS = 'SET_MESSAGE_RETENTION_DAYS_SUCCESS' as const;

export type MessageRetentionDaysAction =
  | { type: typeof MESSAGE_RETENTION_DAYS_LOADED; payload: { days: number | null } }
  | { type: typeof SET_MESSAGE_RETENTION_DAYS; payload: { days: number | null } }
  | { type: typeof SET_MESSAGE_RETENTION_DAYS_SAVING }
  | { type: typeof SET_MESSAGE_RETENTION_DAYS_SUCCESS };

export function messageRetentionDaysLoaded(days: number | null) {
  return {
    type: MESSAGE_RETENTION_DAYS_LOADED,
    payload: {
      days,
    },
  };
}

export function setMessageRetentionDays(days: number | null) {
  return {
    type: SET_MESSAGE_RETENTION_DAYS,
    payload: {
      days,
    },
  };
}

export function setMessageRetentionDaysSaving() {
  return {
    type: SET_MESSAGE_RETENTION_DAYS_SAVING,
  };
}

export function setMessageRetentionDaysSuccess() {
  return {
    type: SET_MESSAGE_RETENTION_DAYS_SUCCESS,
  };
}
