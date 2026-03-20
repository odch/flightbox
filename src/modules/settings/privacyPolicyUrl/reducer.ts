import * as actions from './actions';
import { PrivacyPolicyUrlAction } from './actions';
import reducer from '../../../util/reducer';

interface PrivacyPolicyUrlState {
  url: string | null;
  saving: boolean;
}

function urlLoaded(state: PrivacyPolicyUrlState, action: PrivacyPolicyUrlAction & { type: typeof actions.PRIVACY_POLICY_URL_LOADED }) {
  return {
    ...state,
    url: action.payload.url
  }
}

function saving(state: PrivacyPolicyUrlState) {
  return {
    ...state,
    saving: true,
  };
}

function saveSuccess(state: PrivacyPolicyUrlState) {
  return {
    ...state,
    saving: false,
  };
}

const ACTION_HANDLERS = {
  [actions.PRIVACY_POLICY_URL_LOADED]: urlLoaded,
  [actions.SET_PRIVACY_POLICY_URL_SAVING]: saving,
  [actions.SET_PRIVACY_POLICY_URL_SUCCESS]: saveSuccess,
};

const INITIAL_STATE: PrivacyPolicyUrlState = {
  url: null,
  saving: false,
};

export type { PrivacyPolicyUrlState };
export default reducer<PrivacyPolicyUrlState, PrivacyPolicyUrlAction>(INITIAL_STATE, ACTION_HANDLERS);
