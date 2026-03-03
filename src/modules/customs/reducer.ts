import * as actions from './actions';
import { CustomsAction } from './actions';
import reducer from '../../util/reducer';

interface CustomsState {
  loading: boolean | undefined;
  success: boolean | undefined;
  available: boolean | undefined;
}

const INITIAL_STATE: CustomsState = {
  loading: undefined,
  success: undefined,
  available: undefined
};

const setLoading = (state: CustomsState) => ({
  ...state,
  loading: true
});

const setSuccess = (success: boolean) => (state: CustomsState) => ({
  ...state,
  loading: false,
  success
});

const ACTION_HANDLERS = {
  [actions.SET_START_CUSTOMS_LOADING]: setLoading,
  [actions.START_CUSTOMS_SUCCESS]: setSuccess(true),
  [actions.START_CUSTOMS_FAILURE]: setSuccess(false),
  [actions.SET_CUSTOMS_AVAILABILITY]: (state: CustomsState, action: CustomsAction & { type: typeof actions.SET_CUSTOMS_AVAILABILITY }) => ({
    ...state,
    available: action.payload.available
  }),
};

export type { CustomsState };
export default reducer<CustomsState, CustomsAction>(INITIAL_STATE, ACTION_HANDLERS);
