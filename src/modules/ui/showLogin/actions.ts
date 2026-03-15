export const SHOW_LOGIN = 'SHOW_LOGIN' as const;
export const HIDE_LOGIN = 'HIDE_LOGIN' as const;

export type ShowLoginAction =
  | { type: typeof SHOW_LOGIN }
  | { type: typeof HIDE_LOGIN };

export function showLogin() {
  return {
    type: SHOW_LOGIN,
  };
}

export function hideLogin() {
  return {
    type: HIDE_LOGIN,
  };
}
