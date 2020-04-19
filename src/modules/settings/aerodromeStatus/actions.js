export const LOAD_AERODROME_STATUS = 'LOAD_AERODROME_STATUS';
export const AERODROME_STATUS_LOADING = 'AERODROME_STATUS_LOADING';
export const AERODROME_STATUS_LOADED = 'AERODROME_STATUS_LOADED';
export const UPDATE_AERODROME_STATUS = 'UPDATE_AERODROME_STATUS';
export const SAVE_AERODROME_STATUS = 'SAVE_AERODROME_STATUS';
export const SAVE_AERODROME_STATUS_SUCCESS = 'SAVE_AERODROME_STATUS_SUCCESS';
export const SET_AERODROME_STATUS_SAVING = 'SET_AERODROME_STATUS_SAVING';
export const SELECT_AERODROME_STATUS = 'SELECT_AERODROME_STATUS';
export const WATCH_CURRENT_AERODROME_STATUS = 'WATCH_CURRENT_AERODROME_STATUS';
export const SET_CURRENT_AERODROME_STATUS = 'SET_CURRENT_AERODROME_STATUS';

export const loadAerodromeStatus = () => ({
  type: LOAD_AERODROME_STATUS,
});

export const aerodromeStatusLoading = () => ({
  type: AERODROME_STATUS_LOADING,
});

export const aerodromeStatusLoaded = (data, latest) => ({
  type: AERODROME_STATUS_LOADED,
  payload: {
    data,
    latest
  }
});

export const updateAerodromeStatus = (status, details) => ({
  type: UPDATE_AERODROME_STATUS,
  payload: {
    status,
    details
  }
});

export const saveAerodromeStatus = data => ({
  type: SAVE_AERODROME_STATUS,
  payload: {
    data,
  }
});

export const setAerodromeStatusSaving = () => ({
  type: SET_AERODROME_STATUS_SAVING,
});

export const saveAerodromeStatusSuccess = () => ({
  type: SAVE_AERODROME_STATUS_SUCCESS,
});

export const selectAerodromeStatus = key => ({
  type: SELECT_AERODROME_STATUS,
  payload: {
    key,
  }
});

export const watchCurrentAerodromeStatus = () => ({
  type: WATCH_CURRENT_AERODROME_STATUS,
});

export const setCurrentAerodromeStatus = status => ({
  type: SET_CURRENT_AERODROME_STATUS,
  payload: {
    status
  }
});
