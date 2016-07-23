import * as actions from './actions';
import reducer from '../../../util/reducer';

function lockDateLoading(state) {
  return Object.assign({}, state, {
    loading: true,
  });
}

function lockDateLoaded(state, action) {
  return Object.assign({}, state, {
    loading: false,
    date: action.payload.lockDate,
  });
}

function lockDateSaving(state) {
  return Object.assign({}, state, {
    saving: true,
  });
}

function setLockDateSuccess(state) {
  return Object.assign({}, state, {
    saving: false,
  });
}

const ACTION_HANDLERS = {
  [actions.LOCK_DATE_LOADING]: lockDateLoading,
  [actions.LOCK_DATE_LOADED]: lockDateLoaded,
  [actions.SET_LOCK_DATE_SAVING]: lockDateSaving,
  [actions.SET_LOCK_DATE_SUCCESS]: setLockDateSuccess,
};

const INITIAL_STATE = {
  date: null,
  loading: false,
  saving: false,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
