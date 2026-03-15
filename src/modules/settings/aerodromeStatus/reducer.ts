import ImmutableItemsArray from "../../../util/ImmutableItemsArray"
import reducer from '../../../util/reducer';
import * as actions from './actions';
import { AerodromeStatusAction, AerodromeStatusData } from './actions';

interface AerodromeStatusState {
  data: AerodromeStatusData;
  latest: any;
  selected: string | null;
  loading: boolean;
  saving: boolean;
  current: unknown;
}

const INITIAL_STATE: AerodromeStatusState = {
  data: {
    status: null,
    details: ''
  },
  latest: new ImmutableItemsArray([]) as any,
  selected: null,
  loading: false,
  saving: false,
  current: undefined
};

const aerodromeStatusLoading = (state: AerodromeStatusState) => ({
  ...state,
  loading: true
});

const aerodromeStatusLoaded = (state: AerodromeStatusState, {payload: {data, latest}}: AerodromeStatusAction & { type: typeof actions.AERODROME_STATUS_LOADED }) => ({
  ...state,
  data,
  latest,
  loading: false,
  selected: null
});

const updateStatus = (state: AerodromeStatusState, {payload: {status, details}}: AerodromeStatusAction & { type: typeof actions.UPDATE_AERODROME_STATUS }) => ({
  ...state,
  data: {
    status,
    details
  }
});

const aerodromeStatusSaving = (state: AerodromeStatusState) => ({
  ...state,
  saving: true
});

const saveAerodromeStatusSuccess = (state: AerodromeStatusState) => ({
  ...state,
  saving: false
});

const selectStatus = (state: AerodromeStatusState, {payload: {key}}: AerodromeStatusAction & { type: typeof actions.SELECT_AERODROME_STATUS }) => ({
  ...state,
  selected: key
});

const setCurrentStatus = (state: AerodromeStatusState, {payload: {status}}: AerodromeStatusAction & { type: typeof actions.SET_CURRENT_AERODROME_STATUS }) => ({
  ...state,
  current: status
});

const ACTION_HANDLERS = {
  [actions.AERODROME_STATUS_LOADING]: aerodromeStatusLoading,
  [actions.AERODROME_STATUS_LOADED]: aerodromeStatusLoaded,
  [actions.UPDATE_AERODROME_STATUS]: updateStatus,
  [actions.SET_AERODROME_STATUS_SAVING]: aerodromeStatusSaving,
  [actions.SAVE_AERODROME_STATUS_SUCCESS]: saveAerodromeStatusSuccess,
  [actions.SELECT_AERODROME_STATUS]: selectStatus,
  [actions.SET_CURRENT_AERODROME_STATUS]: setCurrentStatus
};

export type { AerodromeStatusState };
export default reducer<AerodromeStatusState, AerodromeStatusAction>(INITIAL_STATE, ACTION_HANDLERS);
