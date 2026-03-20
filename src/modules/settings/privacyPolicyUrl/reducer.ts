import * as actions from './actions';
import { PrivacyPolicyUrlAction } from './actions';
import reducer from '../../../util/reducer';

interface PrivacyPolicyUrlState {
  url: string | null;
}

function urlLoaded(state: PrivacyPolicyUrlState, action: PrivacyPolicyUrlAction & { type: typeof actions.PRIVACY_POLICY_URL_LOADED }) {
  return {
    ...state,
    url: action.payload.url
  }
}

const ACTION_HANDLERS = {
  [actions.PRIVACY_POLICY_URL_LOADED]: urlLoaded,
};

const INITIAL_STATE: PrivacyPolicyUrlState = {
  url: null,
};

export type { PrivacyPolicyUrlState };
export default reducer<PrivacyPolicyUrlState, PrivacyPolicyUrlAction>(INITIAL_STATE, ACTION_HANDLERS);
