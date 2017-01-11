export const LOAD_USERS = 'LOAD_USERS';
export const SET_USERS_LOADING = 'SET_USERS_LOADING';
export const USERS_LOADED = 'USERS_LOADED';

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

export function usersLoaded(snapshot) {
  return {
    type: USERS_LOADED,
    payload: {
      snapshot,
    },
  };
}
