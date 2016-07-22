import ImmutableItemsArray from '../../../util/ImmutableItemsArray';
import * as actions from './actions';
import reducer, { childrenAdded, setLoading } from '../shared/reducers';

const ACTION_HANDLERS = {
  [actions.ARRIVALS_ADDED]: childrenAdded,
  [actions.SET_ARRIVALS_LOADING]: setLoading,
};

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
