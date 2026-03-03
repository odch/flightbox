import * as actions from './actions';
import { ProfileAction } from './actions';
import reducer from '../../util/reducer';

interface ProfileState {
  profile: Record<string, unknown> | undefined;
  saving: boolean;
}

const INITIAL_STATE: ProfileState = {
  profile: undefined,
  saving: false
};

const profileLoaded = (state: ProfileState, action: ProfileAction & { type: typeof actions.PROFILE_LOADED }) => ({
  ...state,
  profile: action.payload.profile
});

const setSaving = (saving: boolean) => (state: ProfileState) => ({
  ...state,
  saving
});

const ACTION_HANDLERS = {
  [actions.PROFILE_LOADED]: profileLoaded,
  [actions.SAVE_PROFILE]: setSaving(true),
  [actions.SAVE_PROFILE_SUCCESS]: setSaving(false),
  [actions.SAVE_PROFILE_FAILURE]: setSaving(false),
};

export type { ProfileState };
export default reducer<ProfileState, ProfileAction>(INITIAL_STATE, ACTION_HANDLERS);
