export const LOAD_PROFILE = 'LOAD_PROFILE';
export const PROFILE_LOADED = 'PROFILE_LOADED';
export const SAVE_PROFILE = 'SAVE_PROFILE';
export const SAVE_PROFILE_SUCCESS = 'SAVE_PROFILE_SUCCESS';
export const SAVE_PROFILE_FAILURE = 'SAVE_PROFILE_FAILURE';

export function loadProfile() {
  return {
    type: LOAD_PROFILE,
  };
}

export function profileLoaded(profile) {
  return {
    type: PROFILE_LOADED,
    payload: {
      profile
    }
  };
}

export function saveProfile() {
  return {
    type: SAVE_PROFILE,
  };
}

export function saveProfileSuccess() {
  return {
    type: SAVE_PROFILE_SUCCESS,
  };
}

export function saveProfileFailure() {
  return {
    type: SAVE_PROFILE_FAILURE,
  };
}
