import * as actions from './actions';
import { KioskAccessTokenAction } from './actions';
import reducer from '../../../util/reducer';

interface KioskAccessTokenState {
  token: string | null;
}

function tokenLoaded(state: KioskAccessTokenState, action: KioskAccessTokenAction & { type: typeof actions.KIOSK_ACCESS_TOKEN_LOADED }) {
  return {
    ...state,
    token: action.payload.token
  }
}

const ACTION_HANDLERS = {
  [actions.KIOSK_ACCESS_TOKEN_LOADED]: tokenLoaded,
};

const INITIAL_STATE: KioskAccessTokenState = {
  token: null,
};

export type { KioskAccessTokenState };
export default reducer<KioskAccessTokenState, KioskAccessTokenAction>(INITIAL_STATE, ACTION_HANDLERS);
