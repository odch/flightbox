import * as actions from './actions';
import { MovementRetentionDaysAction } from './actions';
import reducer from '../../../util/reducer';

interface MovementRetentionDaysState {
  days: number | null;
  saving: boolean;
}

function daysLoaded(state: MovementRetentionDaysState, action: MovementRetentionDaysAction & { type: typeof actions.MOVEMENT_RETENTION_DAYS_LOADED }) {
  return {
    ...state,
    days: action.payload.days,
  };
}

function saving(state: MovementRetentionDaysState) {
  return {
    ...state,
    saving: true,
  };
}

function saveSuccess(state: MovementRetentionDaysState) {
  return {
    ...state,
    saving: false,
  };
}

const ACTION_HANDLERS = {
  [actions.MOVEMENT_RETENTION_DAYS_LOADED]: daysLoaded,
  [actions.SET_MOVEMENT_RETENTION_DAYS_SAVING]: saving,
  [actions.SET_MOVEMENT_RETENTION_DAYS_SUCCESS]: saveSuccess,
};

const INITIAL_STATE: MovementRetentionDaysState = {
  days: null,
  saving: false,
};

export type { MovementRetentionDaysState };
export default reducer<MovementRetentionDaysState, MovementRetentionDaysAction>(INITIAL_STATE, ACTION_HANDLERS);
