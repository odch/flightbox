export const UPDATE_USERNAME = 'UPDATE_USERNAME';
export const UPDATE_PASSWORD = 'UPDATE_PASSWORD';

export function updateUsername(username) {
  return {
    type: UPDATE_USERNAME,
    payload: {
      username,
    },
  };
}

export function updatePassword(password) {
  return {
    type: UPDATE_PASSWORD,
    payload: {
      password,
    },
  };
}
