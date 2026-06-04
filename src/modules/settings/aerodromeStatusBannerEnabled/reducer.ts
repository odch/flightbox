import * as actions from './actions';
import { AerodromeStatusBannerEnabledAction } from './actions';
import reducer from '../../../util/reducer';

interface AerodromeStatusBannerEnabledState {
  enabled: boolean;
  saving: boolean;
}

function enabledLoaded(state: AerodromeStatusBannerEnabledState, action: AerodromeStatusBannerEnabledAction & { type: typeof actions.AERODROME_STATUS_BANNER_ENABLED_LOADED }) {
  return {
    ...state,
    enabled: action.payload.enabled
  }
}

function saving(state: AerodromeStatusBannerEnabledState) {
  return {
    ...state,
    saving: true,
  };
}

function saveSuccess(state: AerodromeStatusBannerEnabledState) {
  return {
    ...state,
    saving: false,
  };
}

const ACTION_HANDLERS = {
  [actions.AERODROME_STATUS_BANNER_ENABLED_LOADED]: enabledLoaded,
  [actions.SET_AERODROME_STATUS_BANNER_ENABLED_SAVING]: saving,
  [actions.SET_AERODROME_STATUS_BANNER_ENABLED_SUCCESS]: saveSuccess,
};

const INITIAL_STATE: AerodromeStatusBannerEnabledState = {
  enabled: false,
  saving: false,
};

export type { AerodromeStatusBannerEnabledState };
export default reducer<AerodromeStatusBannerEnabledState, AerodromeStatusBannerEnabledAction>(INITIAL_STATE, ACTION_HANDLERS);
