export const UPDATE_USERNAME = 'UPDATE_USERNAME' as const;
export const UPDATE_PASSWORD = 'UPDATE_PASSWORD' as const;
export const UPDATE_EMAIL = 'UPDATE_EMAIL' as const;

export type LoginPageAction =
  | { type: typeof UPDATE_USERNAME; payload: { username: string } }
  | { type: typeof UPDATE_PASSWORD; payload: { password: string } }
  | { type: typeof UPDATE_EMAIL; payload: { email: string } };

export function updateUsername(username: string) {
  return {
    type: UPDATE_USERNAME,
    payload: {
      username,
    },
  };
}

export function updatePassword(password: string) {
  return {
    type: UPDATE_PASSWORD,
    payload: {
      password,
    },
  };
}

export function updateEmail(email: string) {
  return {
    type: UPDATE_EMAIL,
    payload: {
      email,
    },
  };
}
