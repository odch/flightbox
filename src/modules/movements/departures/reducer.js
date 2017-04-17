import ImmutableItemsArray from '../../../util/ImmutableItemsArray';
import * as actions from './actions';
import reducer, {
  childrenAdded,
  childAdded,
  childChanged,
  childRemoved,
  setLoading,
  setLoadingFailure
} from '../shared/reducers';

const ACTION_HANDLERS = {
  [actions.DEPARTURES_ADDED]: childrenAdded,
  [actions.DEPARTURE_ADDED]: childAdded,
  [actions.DEPARTURE_CHANGED]: childChanged,
  [actions.DEPARTURE_DELETED]: childRemoved,
  [actions.SET_DEPARTURES_LOADING]: setLoading,
  [actions.LOAD_DEPARTURES_FAILURE]: setLoadingFailure,
};

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
  loadingFailed: false,
  refs: []
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
