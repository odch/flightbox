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

export const setAssociatedMovements = (state, action) => ({
  ...state,
  associatedMovements: {
    ...state.associatedMovements,
    ...action.payload.associatedMovements
  }
});

export const setMovementsByImmatriculation = (state, action) => ({
  ...state,
  byImmatriculation: {
    ...state.byImmatriculation,
    [action.payload.immatriculation]: action.payload.movements
  }
});

const ACTION_HANDLERS = {
  [actions.SET_MOVEMENTS]: setMovements,
  [actions.SET_ASSOCIATED_MOVEMENTS]: setAssociatedMovements,
  [actions.SET_MOVEMENTS_BY_IMMATRICULATION]: setMovementsByImmatriculation,
  [actions.SET_MOVEMENTS_LOADING]: setLoading,
  [actions.LOAD_MOVEMENTS_FAILURE]: setLoadingFailure,
};

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
  loadingFailed: false,
  associatedMovements: {},
  byImmatriculation: {},
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
