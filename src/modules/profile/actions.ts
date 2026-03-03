export const LOAD_PROFILE = 'LOAD_PROFILE' as const;
export const PROFILE_LOADED = 'PROFILE_LOADED' as const;
export const SAVE_PROFILE = 'SAVE_PROFILE' as const;
export const SAVE_PROFILE_SUCCESS = 'SAVE_PROFILE_SUCCESS' as const;
export const SAVE_PROFILE_FAILURE = 'SAVE_PROFILE_FAILURE' as const;

export type ProfileAction =
  | { type: typeof LOAD_PROFILE }
  | { type: typeof PROFILE_LOADED; payload: { profile: Record<string, unknown> } }
  | { type: typeof SAVE_PROFILE; payload: { values: Record<string, unknown> } }
  | { type: typeof SAVE_PROFILE_SUCCESS }
  | { type: typeof SAVE_PROFILE_FAILURE };

export function loadProfile() {
  return {
    type: LOAD_PROFILE,
  };
}

export function profileLoaded(profile: Record<string, unknown>) {
  return {
    type: PROFILE_LOADED,
    payload: {
      profile
    }
  };
}

export function saveProfile(values: Record<string, unknown>) {
  return {
    type: SAVE_PROFILE,
    payload: {
      values
    }
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
