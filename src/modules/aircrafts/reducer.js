import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import reducer from '../../util/reducer';

function aircraftsLoaded(state, action) {
  const snapshot = action.payload.snapshot;

  const aircrafts = [];

  snapshot.forEach(item => {
    const aircraft = item.val();
    aircraft.key = item.key;
    aircrafts.unshift(aircraft);
  });

  return Object.assign({}, state, {
    data: new ImmutableItemsArray(aircrafts),
    loading: false,
  });
}

function setLoading(state) {
  return Object.assign({}, state, {
    loading: true,
  });
}

const ACTION_HANDLERS = {
  [actions.AIRCRAFTS_LOADED]: aircraftsLoaded,
  [actions.SET_AIRCRAFTS_LOADING]: setLoading,
};

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
  selected: null,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
