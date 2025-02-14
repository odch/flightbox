export const GUEST_ACCESS_TOKEN_LOADED = 'GUEST_ACCESS_TOKEN_LOADED';

export function guestAccessTokenLoaded(token) {
  return {
    type: GUEST_ACCESS_TOKEN_LOADED,
    payload: {
      token
    }
  };
}
