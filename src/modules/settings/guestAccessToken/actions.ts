export const GUEST_ACCESS_TOKEN_LOADED = 'GUEST_ACCESS_TOKEN_LOADED' as const;

export type GuestAccessTokenAction =
  | { type: typeof GUEST_ACCESS_TOKEN_LOADED; payload: { token: string | null } };

export function guestAccessTokenLoaded(token: string | null) {
  return {
    type: GUEST_ACCESS_TOKEN_LOADED,
    payload: {
      token
    }
  };
}
