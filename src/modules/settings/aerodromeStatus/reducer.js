import ImmutableItemsArray from "../../../util/ImmutableItemsArray"
import reducer from '../../../util/reducer';
import * as actions from './actions';

const INITIAL_STATE = {
  data: {
    status: null,
    details: ''
  },
  latest: new ImmutableItemsArray(),
  selected: null,
  loading: false,
  saving: false,
  current: undefined
};

const aerodromeStatusLoading = state => ({
  ...state,
  loading: true
});

const aerodromeStatusLoaded = (state, {payload: {data, latest}}) => ({
  ...state,
  data,
  latest,
  loading: false,
  selected: null
});

const updateStatus = (state, {payload: {status, details}}) => ({
  ...state,
  data: {
    status,
    details
  }
});

const aerodromeStatusSaving = state => ({
  ...state,
  saving: true
});

const saveAerodromeStatusSuccess = state => ({
  ...state,
  saving: false
});

const selectStatus = (state, {payload: {key}}) => ({
  ...state,
  selected: key
});

const setCurrentStatus = (state, {payload: {status}}) => ({
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

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
