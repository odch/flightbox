export const KIOSK_ACCESS_TOKEN_LOADED = 'KIOSK_ACCESS_TOKEN_LOADED' as const;

export type KioskAccessTokenAction =
  | { type: typeof KIOSK_ACCESS_TOKEN_LOADED; payload: { token: string | null } };

export function kioskAccessTokenLoaded(token: string | null) {
  return {
    type: KIOSK_ACCESS_TOKEN_LOADED,
    payload: {
      token
    }
  };
}
