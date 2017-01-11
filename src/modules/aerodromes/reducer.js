import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import reducer from '../../util/reducer';

function aerodromesLoaded(state, action) {
  const snapshot = action.payload.snapshot;

  const aerodromes = [];

  snapshot.forEach(item => {
    const aerodrome = item.val();
    aerodrome.key = item.key();
    aerodromes.unshift(aerodrome);
  });

  return Object.assign({}, state, {
    data: new ImmutableItemsArray(aerodromes),
    loading: false,
  });
}

function setLoading(state) {
  return Object.assign({}, state, {
    loading: true,
  });
}

const ACTION_HANDLERS = {
  [actions.AERODROMES_LOADED]: aerodromesLoaded,
  [actions.SET_AERODROMES_LOADING]: setLoading,
};

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
  selected: null,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
