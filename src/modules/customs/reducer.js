import * as actions from './actions';
import reducer from '../../util/reducer';

const INITIAL_STATE = {
  loading: undefined,
  success: undefined,
  available: undefined
};

const setLoading = (state) => ({
  ...state,
  loading: true
})

const setSuccess = (success) => (state) => ({
  ...state,
  loading: false,
  success
})

const ACTION_HANDLERS = {
  [actions.SET_START_CUSTOMS_LOADING]: setLoading,
  [actions.START_CUSTOMS_SUCCESS]: setSuccess(true),
  [actions.START_CUSTOMS_FAILURE]: setSuccess(false),
  [actions.SET_CUSTOMS_AVAILABILITY]: (state, action) => ({
    ...state,
    available: action.payload.available
  }),
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
