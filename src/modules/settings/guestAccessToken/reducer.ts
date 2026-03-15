import * as actions from './actions';
import { GuestAccessTokenAction } from './actions';
import reducer from '../../../util/reducer';

interface GuestAccessTokenState {
  token: string | null;
}

function tokenLoaded(state: GuestAccessTokenState, action: GuestAccessTokenAction & { type: typeof actions.GUEST_ACCESS_TOKEN_LOADED }) {
  return {
    ...state,
    token: action.payload.token
  }
}

const ACTION_HANDLERS = {
  [actions.GUEST_ACCESS_TOKEN_LOADED]: tokenLoaded,
};

const INITIAL_STATE: GuestAccessTokenState = {
  token: null,
};

export type { GuestAccessTokenState };
export default reducer<GuestAccessTokenState, GuestAccessTokenAction>(INITIAL_STATE, ACTION_HANDLERS);
