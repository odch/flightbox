export const LOAD_PROFILE = 'LOAD_PROFILE' as const;
export const PROFILE_LOADED = 'PROFILE_LOADED' as const;
export const SAVE_PROFILE = 'SAVE_PROFILE' as const;
export const SAVE_PROFILE_SUCCESS = 'SAVE_PROFILE_SUCCESS' as const;
export const SAVE_PROFILE_FAILURE = 'SAVE_PROFILE_FAILURE' as const;
export const SAVE_LANGUAGE = 'SAVE_LANGUAGE' as const;
export const ADD_PROFILE_AIRCRAFT = 'ADD_PROFILE_AIRCRAFT' as const;
export const UPDATE_PROFILE_AIRCRAFT = 'UPDATE_PROFILE_AIRCRAFT' as const;
export const REMOVE_PROFILE_AIRCRAFT = 'REMOVE_PROFILE_AIRCRAFT' as const;

import type { Aircraft } from './migration';

export type ProfileAction =
  | { type: typeof LOAD_PROFILE }
  | { type: typeof PROFILE_LOADED; payload: { profile: Record<string, unknown> } }
  | { type: typeof SAVE_PROFILE; payload: { values: Record<string, unknown> } }
  | { type: typeof SAVE_PROFILE_SUCCESS }
  | { type: typeof SAVE_PROFILE_FAILURE }
  | { type: typeof SAVE_LANGUAGE; payload: { language: string } }
  | { type: typeof ADD_PROFILE_AIRCRAFT; payload: { aircraft: Aircraft } }
  | { type: typeof UPDATE_PROFILE_AIRCRAFT; payload: { index: number; aircraft: Aircraft } }
  | { type: typeof REMOVE_PROFILE_AIRCRAFT; payload: { index: number } };

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

export function saveLanguage(language: string) {
  return {
    type: SAVE_LANGUAGE,
    payload: { language },
  };
}

export function addAircraft(aircraft: Aircraft) {
  return {
    type: ADD_PROFILE_AIRCRAFT,
    payload: { aircraft },
  };
}

export function updateAircraft(index: number, aircraft: Aircraft) {
  return {
    type: UPDATE_PROFILE_AIRCRAFT,
    payload: { index, aircraft },
  };
}

export function removeAircraft(index: number) {
  return {
    type: REMOVE_PROFILE_AIRCRAFT,
    payload: { index },
  };
}
