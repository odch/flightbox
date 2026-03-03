import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';

interface MovementsFilter {
  date: {
    start: string | null;
    end: string | null;
  };
  immatriculation: string;
  onlyWithoutAssociatedMovement: boolean;
}

interface MovementsState {
  data: any;
  associatedMovements: {
    departures: Record<string, unknown>;
    arrivals: Record<string, unknown>;
  };
  loading: boolean;
  loadingFailed: boolean;
  byKey: Record<string, unknown>;
  filter: MovementsFilter;
  previousFilter: MovementsFilter | null;
}

export function setMovements(state: MovementsState, action: any) {
  return Object.assign({}, state, {
    data: action.payload.movements,
    loading: false
  });
}

export function setLoading(state: MovementsState) {
  return Object.assign({}, state, {
    loading: true,
    loadingFailed: false
  });
}

export function setLoadingFailure(state: MovementsState) {
  return Object.assign({}, state, {
    loadingFailed: true,
    loading: false
  });
}

export const setFilter = (state: MovementsState, action: any) => ({
  ...state,
  previousFilter: state.filter,
  filter: action.payload.filter
});

export const addMovementByKey = (state: MovementsState, action: any) => ({
  ...state,
  byKey: {
    ...state.byKey,
    [action.payload.movement.key]: action.payload.movement
  }
});

export const clearMovementsByKey = (state: MovementsState) => ({
  ...state,
  byKey: {}
});

export const clearAssociatedMovements = (state: MovementsState) => ({
  ...state,
  associatedMovements: INITIAL_STATE.associatedMovements
});

export const setAssociatedMovement = (state: MovementsState, action: any) => ({
  ...state,
  associatedMovements: {
    ...state.associatedMovements,
    [action.payload.movementType === 'departure' ? 'departures' : 'arrivals']: {
      ...state.associatedMovements[action.payload.movementType === 'departure' ? 'departures' : 'arrivals'],
      [action.payload.movementKey]: action.payload.associatedMovement
    }
  }
});

const ACTION_HANDLERS: Record<string, (state: MovementsState, action: any) => MovementsState> = {
  [actions.SET_MOVEMENTS]: setMovements,
  [actions.SET_MOVEMENTS_LOADING]: setLoading,
  [actions.LOAD_MOVEMENTS_FAILURE]: setLoadingFailure,
  [actions.SET_MOVEMENTS_FILTER]: setFilter,
  [actions.ADD_MOVEMENT_BY_KEY]: addMovementByKey,
  [actions.CLEAR_MOVEMENTS_BY_KEY]: clearMovementsByKey,
  [actions.SET_ASSOCIATED_MOVEMENT]: setAssociatedMovement,
  [actions.CLEAR_ASSOCIATED_MOVEMENTS]: clearAssociatedMovements,
};

const INITIAL_STATE: MovementsState = {
  data: new ImmutableItemsArray([]),
  associatedMovements: {
    departures: {},
    arrivals: {}
  },
  loading: false,
  loadingFailed: false,
  byKey: {},
  filter: {
    date: {
      start: null,
      end: null
    },
    immatriculation: '',
    onlyWithoutAssociatedMovement: false
  },
  previousFilter: null
};

const reducer = (initialState: MovementsState, actionHandlers: Record<string, (state: MovementsState, action: any) => MovementsState>) => {
  return (state: MovementsState = initialState, action: any): MovementsState => {
    const handler = actionHandlers[action.type];
    if (handler) {
      return handler(state, action);
    }
    return state;
  };
};

export type { MovementsState };
export default reducer(INITIAL_STATE, ACTION_HANDLERS);
