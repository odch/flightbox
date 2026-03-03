export const LOAD_LOCK_DATE = 'LOAD_LOCK_DATE' as const;
export const LOCK_DATE_LOADING = 'LOCK_DATE_LOADING' as const;
export const LOCK_DATE_LOADED = 'LOCK_DATE_LOADED' as const;
export const SET_LOCK_DATE = 'SET_LOCK_DATE' as const;
export const SET_LOCK_DATE_SUCCESS = 'SET_LOCK_DATE_SUCCESS' as const;
export const SET_LOCK_DATE_SAVING = 'SET_LOCK_DATE_SAVING' as const;

export type LockDateAction =
  | { type: typeof LOAD_LOCK_DATE }
  | { type: typeof LOCK_DATE_LOADING }
  | { type: typeof LOCK_DATE_LOADED; payload: { lockDate: string | null } }
  | { type: typeof SET_LOCK_DATE; payload: { lockDate: string } }
  | { type: typeof SET_LOCK_DATE_SUCCESS }
  | { type: typeof SET_LOCK_DATE_SAVING };

export function loadLockDate() {
  return {
    type: LOAD_LOCK_DATE,
  };
}

export function lockDateLoading() {
  return {
    type: LOCK_DATE_LOADING,
  };
}

export function lockDateLoaded(lockDate: string | null) {
  return {
    type: LOCK_DATE_LOADED,
    payload: {
      lockDate,
    },
  };
}

export function setLockDate(lockDate: string) {
  return {
    type: SET_LOCK_DATE,
    payload: {
      lockDate,
    },
  };
}

export function setLockDateSaving() {
  return {
    type: SET_LOCK_DATE_SAVING,
  };
}

export function setLockDateSuccess() {
  return {
    type: SET_LOCK_DATE_SUCCESS,
  };
}
