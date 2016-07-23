export const LOAD_LOCK_DATE = 'LOAD_LOCK_DATE';
export const LOCK_DATE_LOADING = 'LOCK_DATE_LOADING';
export const LOCK_DATE_LOADED = 'LOCK_DATE_LOADED';
export const SET_LOCK_DATE = 'SET_LOCK_DATE';
export const SET_LOCK_DATE_SUCCESS = 'SET_LOCK_DATE_SUCCESS';
export const SET_LOCK_DATE_SAVING = 'SET_LOCK_DATE_SAVING';

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

export function lockDateLoaded(lockDate) {
  return {
    type: LOCK_DATE_LOADED,
    payload: {
      lockDate,
    },
  };
}

export function setLockDate(lockDate) {
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
