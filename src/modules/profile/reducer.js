import * as actions from './actions';
import reducer from '../../util/reducer';

const INITIAL_STATE = {
  profile: undefined,
  saving: false
};

const profileLoaded = (state, action) => ({
  ...state,
  profile: action.payload.profile
})

const setSaving = (saving) => (state, action) => ({
  ...state,
  saving
})

const ACTION_HANDLERS = {
  [actions.PROFILE_LOADED]: profileLoaded,
  [actions.SAVE_PROFILE]: setSaving(true),
  [actions.SAVE_PROFILE_SUCCESS]: setSaving(false),
  [actions.SAVE_PROFILE_FAILURE]: setSaving(false),
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
