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
  previousFilter: state.filter,
  filter: action.payload.filter
})

export const addMovementByKey = (state, action) => ({
  ...state,
  byKey: {
    ...state.byKey,
    [action.payload.movement.key]: action.payload.movement
  }
});

export const clearMovementsByKey = (state) => ({
  ...state,
  byKey: {}
});

export const clearAssociatedMovements = (state) => ({
  ...state,
  associatedMovements: INITIAL_STATE.associatedMovements
});

export const setAssociatedMovement = (state, action) => ({
  ...state,
  associatedMovements: {
    ...state.associatedMovements,
    [action.payload.movementType === 'departure' ? 'departures' : 'arrivals']: {
      ...state.associatedMovements[action.payload.movementType === 'departure' ? 'departures' : 'arrivals'],
      [action.payload.movementKey]: action.payload.associatedMovement
    }
  }
});

const ACTION_HANDLERS = {
  [actions.SET_MOVEMENTS]: setMovements,
  [actions.SET_MOVEMENTS_LOADING]: setLoading,
  [actions.LOAD_MOVEMENTS_FAILURE]: setLoadingFailure,
  [actions.SET_MOVEMENTS_FILTER]: setFilter,
  [actions.ADD_MOVEMENT_BY_KEY]: addMovementByKey,
  [actions.CLEAR_MOVEMENTS_BY_KEY]: clearMovementsByKey,
  [actions.SET_ASSOCIATED_MOVEMENT]: setAssociatedMovement,
  [actions.CLEAR_ASSOCIATED_MOVEMENTS]: clearAssociatedMovements,
};

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  associatedMovements: {
    departures: {},
    arrivals: {}
  },
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
  },
  previousFilter: null
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
