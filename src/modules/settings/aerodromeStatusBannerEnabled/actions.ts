export const AERODROME_STATUS_BANNER_ENABLED_LOADED = 'AERODROME_STATUS_BANNER_ENABLED_LOADED' as const;
export const SET_AERODROME_STATUS_BANNER_ENABLED = 'SET_AERODROME_STATUS_BANNER_ENABLED' as const;
export const SET_AERODROME_STATUS_BANNER_ENABLED_SAVING = 'SET_AERODROME_STATUS_BANNER_ENABLED_SAVING' as const;
export const SET_AERODROME_STATUS_BANNER_ENABLED_SUCCESS = 'SET_AERODROME_STATUS_BANNER_ENABLED_SUCCESS' as const;

export type AerodromeStatusBannerEnabledAction =
  | { type: typeof AERODROME_STATUS_BANNER_ENABLED_LOADED; payload: { enabled: boolean } }
  | { type: typeof SET_AERODROME_STATUS_BANNER_ENABLED; payload: { enabled: boolean } }
  | { type: typeof SET_AERODROME_STATUS_BANNER_ENABLED_SAVING }
  | { type: typeof SET_AERODROME_STATUS_BANNER_ENABLED_SUCCESS };

export function aerodromeStatusBannerEnabledLoaded(enabled: boolean) {
  return {
    type: AERODROME_STATUS_BANNER_ENABLED_LOADED,
    payload: {
      enabled
    }
  };
}

export function setAerodromeStatusBannerEnabled(enabled: boolean) {
  return {
    type: SET_AERODROME_STATUS_BANNER_ENABLED,
    payload: {
      enabled,
    },
  };
}

export function setAerodromeStatusBannerEnabledSaving() {
  return {
    type: SET_AERODROME_STATUS_BANNER_ENABLED_SAVING,
  };
}

export function setAerodromeStatusBannerEnabledSuccess() {
  return {
    type: SET_AERODROME_STATUS_BANNER_ENABLED_SUCCESS,
  };
}
