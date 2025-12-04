export const KIOSK_ACCESS_TOKEN_LOADED = 'KIOSK_ACCESS_TOKEN_LOADED';

export function kioskAccessTokenLoaded(token) {
  return {
    type: KIOSK_ACCESS_TOKEN_LOADED,
    payload: {
      token
    }
  };
}
