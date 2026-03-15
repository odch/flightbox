export const LOAD_USERS = 'LOAD_USERS' as const;
export const SET_USERS_LOADING = 'SET_USERS_LOADING' as const;
export const USERS_LOADED = 'USERS_LOADED' as const;

export type UsersAction =
  | { type: typeof LOAD_USERS }
  | { type: typeof SET_USERS_LOADING }
  | { type: typeof USERS_LOADED; payload: { snapshot: unknown } };

export function loadUsers() {
  return {
    type: LOAD_USERS,
  };
}

export function setUsersLoading() {
  return {
    type: SET_USERS_LOADING,
  };
}

export function usersLoaded(snapshot: unknown) {
  return {
    type: USERS_LOADED,
    payload: {
      snapshot,
    },
  };
}
