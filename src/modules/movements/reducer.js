import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';

export function setMovements(state, action) {
  return Object.assign({}, state, {
    data: action.payload.movements,
    loading: false
  });
}

export function setLoading(state) {
  return Object.assign({}, state, {
    loading: true,
    loadingFailed: false
  });
}

export function setLoadingFailure(state) {
  return Object.assign({}, state, {
    loadingFailed: true,
    loading: false
  });
}

export const setFilter = (state, action) => ({
  ...state,
  filter: action.payload.filter
})

export const addMovementByKey = (state, action) => ({
  ...state,
  byKey: {
    ...state.byKey,
    [action.payload.movement.key]: action.payload.movement
  }
});

export const clearMovementsByKey = (state, action) => ({
  ...state,
  byKey: {}
});

const ACTION_HANDLERS = {
  [actions.SET_MOVEMENTS]: setMovements,
  [actions.SET_MOVEMENTS_LOADING]: setLoading,
  [actions.LOAD_MOVEMENTS_FAILURE]: setLoadingFailure,
  [actions.SET_MOVEMENTS_FILTER]: setFilter,
  [actions.ADD_MOVEMENT_BY_KEY]: addMovementByKey,
  [actions.CLEAR_MOVEMENTS_BY_KEY]: clearMovementsByKey,
};

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
  loadingFailed: false,
  byKey: {},
  filter: {
    date: { // "end" is the newer date bound ("start" must come before "end")
      start: null,
      end: null
    },
    immatriculation: '',
    onlyWithoutAssociatedMovement: false
  }
};

const reducer = (initialState, actionHandlers) => {
  return (state = initialState, action) => {
    const handler = actionHandlers[action.type];
    if (handler) {
      return handler(state, action);
    }
    return state;
  };
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
