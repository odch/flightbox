import * as actions from './actions';
import { CustomsSyncStatus, CustomsSyncStatusAction, CustomsSyncStatusKey } from './actions';
import reducer from '../../../util/reducer';

interface CustomsSyncStatusState {
  statuses: Partial<Record<CustomsSyncStatusKey, CustomsSyncStatus>>;
}

function statusLoaded(state: CustomsSyncStatusState, action: CustomsSyncStatusAction & { type: typeof actions.CUSTOMS_SYNC_STATUS_LOADED }) {
  const statuses = action.payload.statuses;
  return {
    ...state,
    statuses: statuses && typeof statuses === 'object' ? statuses as CustomsSyncStatusState['statuses'] : {},
  };
}

const ACTION_HANDLERS = {
  [actions.CUSTOMS_SYNC_STATUS_LOADED]: statusLoaded,
};

const INITIAL_STATE: CustomsSyncStatusState = {
  statuses: {},
};

export type { CustomsSyncStatusState };
export default reducer<CustomsSyncStatusState, CustomsSyncStatusAction>(INITIAL_STATE, ACTION_HANDLERS);
