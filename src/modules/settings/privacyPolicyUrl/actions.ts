export const PRIVACY_POLICY_URL_LOADED = 'PRIVACY_POLICY_URL_LOADED' as const;
export const SET_PRIVACY_POLICY_URL = 'SET_PRIVACY_POLICY_URL' as const;
export const SET_PRIVACY_POLICY_URL_SAVING = 'SET_PRIVACY_POLICY_URL_SAVING' as const;
export const SET_PRIVACY_POLICY_URL_SUCCESS = 'SET_PRIVACY_POLICY_URL_SUCCESS' as const;

export type PrivacyPolicyUrlAction =
  | { type: typeof PRIVACY_POLICY_URL_LOADED; payload: { url: string | null } }
  | { type: typeof SET_PRIVACY_POLICY_URL; payload: { url: string | null } }
  | { type: typeof SET_PRIVACY_POLICY_URL_SAVING }
  | { type: typeof SET_PRIVACY_POLICY_URL_SUCCESS };

export function privacyPolicyUrlLoaded(url: string | null) {
  return {
    type: PRIVACY_POLICY_URL_LOADED,
    payload: {
      url
    }
  };
}

export function setPrivacyPolicyUrl(url: string | null) {
  return {
    type: SET_PRIVACY_POLICY_URL,
    payload: {
      url,
    },
  };
}

export function setPrivacyPolicyUrlSaving() {
  return {
    type: SET_PRIVACY_POLICY_URL_SAVING,
  };
}

export function setPrivacyPolicyUrlSuccess() {
  return {
    type: SET_PRIVACY_POLICY_URL_SUCCESS,
  };
}
