export const PRIVACY_POLICY_URL_LOADED = 'PRIVACY_POLICY_URL_LOADED' as const;

export type PrivacyPolicyUrlAction =
  | { type: typeof PRIVACY_POLICY_URL_LOADED; payload: { url: string | null } };

export function privacyPolicyUrlLoaded(url: string | null) {
  return {
    type: PRIVACY_POLICY_URL_LOADED,
    payload: {
      url
    }
  };
}
