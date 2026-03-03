import * as actions from './actions';
import { LockDateAction } from './actions';
import reducer from '../../../util/reducer';

interface LockDateState {
  date: string | null;
  loading: boolean;
  saving: boolean;
}

function lockDateLoading(state: LockDateState) {
  return Object.assign({}, state, {
    loading: true,
  });
}

function lockDateLoaded(state: LockDateState, action: LockDateAction & { type: typeof actions.LOCK_DATE_LOADED }) {
  return Object.assign({}, state, {
    loading: false,
    date: action.payload.lockDate,
  });
}

function lockDateSaving(state: LockDateState) {
  return Object.assign({}, state, {
    saving: true,
  });
}

function setLockDateSuccess(state: LockDateState) {
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

const INITIAL_STATE: LockDateState = {
  date: null,
  loading: false,
  saving: false,
};

export type { LockDateState };
export default reducer<LockDateState, LockDateAction>(INITIAL_STATE, ACTION_HANDLERS);
