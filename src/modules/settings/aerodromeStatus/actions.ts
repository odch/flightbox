export const LOAD_AERODROME_STATUS = 'LOAD_AERODROME_STATUS' as const;
export const AERODROME_STATUS_LOADING = 'AERODROME_STATUS_LOADING' as const;
export const AERODROME_STATUS_LOADED = 'AERODROME_STATUS_LOADED' as const;
export const UPDATE_AERODROME_STATUS = 'UPDATE_AERODROME_STATUS' as const;
export const SAVE_AERODROME_STATUS = 'SAVE_AERODROME_STATUS' as const;
export const SAVE_AERODROME_STATUS_SUCCESS = 'SAVE_AERODROME_STATUS_SUCCESS' as const;
export const SET_AERODROME_STATUS_SAVING = 'SET_AERODROME_STATUS_SAVING' as const;
export const SELECT_AERODROME_STATUS = 'SELECT_AERODROME_STATUS' as const;
export const WATCH_CURRENT_AERODROME_STATUS = 'WATCH_CURRENT_AERODROME_STATUS' as const;
export const SET_CURRENT_AERODROME_STATUS = 'SET_CURRENT_AERODROME_STATUS' as const;

export interface AerodromeStatusData {
  status: string | null;
  details: string;
}

export type AerodromeStatusAction =
  | { type: typeof LOAD_AERODROME_STATUS }
  | { type: typeof AERODROME_STATUS_LOADING }
  | { type: typeof AERODROME_STATUS_LOADED; payload: { data: AerodromeStatusData; latest: unknown } }
  | { type: typeof UPDATE_AERODROME_STATUS; payload: { status: string; details: string } }
  | { type: typeof SAVE_AERODROME_STATUS; payload: { data: AerodromeStatusData } }
  | { type: typeof SAVE_AERODROME_STATUS_SUCCESS }
  | { type: typeof SET_AERODROME_STATUS_SAVING }
  | { type: typeof SELECT_AERODROME_STATUS; payload: { key: string } }
  | { type: typeof WATCH_CURRENT_AERODROME_STATUS }
  | { type: typeof SET_CURRENT_AERODROME_STATUS; payload: { status: unknown } };

export const loadAerodromeStatus = () => ({
  type: LOAD_AERODROME_STATUS,
});

export const aerodromeStatusLoading = () => ({
  type: AERODROME_STATUS_LOADING,
});

export const aerodromeStatusLoaded = (data: AerodromeStatusData, latest: unknown) => ({
  type: AERODROME_STATUS_LOADED,
  payload: {
    data,
    latest
  }
});

export const updateAerodromeStatus = (status: string, details: string) => ({
  type: UPDATE_AERODROME_STATUS,
  payload: {
    status,
    details
  }
});

export const saveAerodromeStatus = (data: AerodromeStatusData) => ({
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

export const selectAerodromeStatus = (key: string) => ({
  type: SELECT_AERODROME_STATUS,
  payload: {
    key,
  }
});

export const watchCurrentAerodromeStatus = () => ({
  type: WATCH_CURRENT_AERODROME_STATUS,
});

export const setCurrentAerodromeStatus = (status: unknown) => ({
  type: SET_CURRENT_AERODROME_STATUS,
  payload: {
    status
  }
});
