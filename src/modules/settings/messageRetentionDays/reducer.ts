import * as actions from './actions';
import { MessageRetentionDaysAction } from './actions';
import reducer from '../../../util/reducer';

interface MessageRetentionDaysState {
  days: number | null;
  saving: boolean;
}

function daysLoaded(state: MessageRetentionDaysState, action: MessageRetentionDaysAction & { type: typeof actions.MESSAGE_RETENTION_DAYS_LOADED }) {
  return {
    ...state,
    days: action.payload.days,
  };
}

function saving(state: MessageRetentionDaysState) {
  return {
    ...state,
    saving: true,
  };
}

function saveSuccess(state: MessageRetentionDaysState) {
  return {
    ...state,
    saving: false,
  };
}

const ACTION_HANDLERS = {
  [actions.MESSAGE_RETENTION_DAYS_LOADED]: daysLoaded,
  [actions.SET_MESSAGE_RETENTION_DAYS_SAVING]: saving,
  [actions.SET_MESSAGE_RETENTION_DAYS_SUCCESS]: saveSuccess,
};

const INITIAL_STATE: MessageRetentionDaysState = {
  days: null,
  saving: false,
};

export type { MessageRetentionDaysState };
export default reducer<MessageRetentionDaysState, MessageRetentionDaysAction>(INITIAL_STATE, ACTION_HANDLERS);
