import * as actions from './actions';
import reducer from '../../../util/reducer';

function tokenLoaded(state, action) {
  return {
    ...state,
    token: action.payload.token
  }
}

const ACTION_HANDLERS = {
  [actions.KIOSK_ACCESS_TOKEN_LOADED]: tokenLoaded,
};

const INITIAL_STATE = {
  token: null,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
