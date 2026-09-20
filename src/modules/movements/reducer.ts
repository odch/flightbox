import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import { WIZARD_FINISH } from '../ui/wizard/actions';

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
  lastSaved: Record<string, any> | null;
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

export const movementByKeyUnavailable = (state: MovementsState, action: any) => ({
  ...state,
  byKey: {
    ...state.byKey,
    [action.payload.key]: null
  }
});

// Sentinel stored in `byKey` for a movement that exists but is not readable by
// the current user (read rules deny it). Distinct from `null` (not found) so the
// associated-movement view can show "recorded by another person" rather than a
// "create" prompt. Compared by reference.
export const FORBIDDEN_MOVEMENT = { forbidden: true } as const;

export const movementByKeyForbidden = (state: MovementsState, action: any) => ({
  ...state,
  byKey: {
    ...state.byKey,
    [action.payload.key]: FORBIDDEN_MOVEMENT
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

// The movement most recently written, kept so a follow-up wizard — "record
// departure" straight after an arrival, or the reverse — can prefill from it.
// Guest/kiosk cannot read their own movements back — they are ownerless and
// their token carries no email claim, so `movementItemRead` denies it — which
// makes this the only source for them.
//
// Deliberately a single slot rather than a by-key map: a kiosk browser stays
// open indefinitely and records movements back to back, so a map would grow
// without bound and keep every pilot's PII resident on a shared device.
//
// `values` are the local-form wizard values (date/time, no dateTime), so they
// must not be passed through firebaseToLocal. `key` is overridden explicitly:
// it only comes back from the save for a newly created movement.
export const saveMovementSuccess = (state: MovementsState, action: any) => ({
  ...state,
  lastSaved: { ...action.payload.values, key: action.payload.key }
});

// Dropped when the pilot finishes, so their details do not linger on a shared
// device any longer than the flow needs them. The "record departure" path does
// not go through finish(), so this never clears a movement about to be used.
//
// Not cleared on START_INITIALIZE_WIZARD: initMovement dispatches that *before*
// reading the cache, so clearing there would kill the prefill. If a pilot
// abandons the finish screen without pressing finish, the values survive until
// the next save or until logout (which reloads the page and drops the store).
export const clearLastSaved = (state: MovementsState) => ({
  ...state,
  lastSaved: null
});

const ACTION_HANDLERS: Record<string, (state: MovementsState, action: any) => MovementsState> = {
  [actions.SET_MOVEMENTS]: setMovements,
  [actions.SET_MOVEMENTS_LOADING]: setLoading,
  [actions.LOAD_MOVEMENTS_FAILURE]: setLoadingFailure,
  [actions.SET_MOVEMENTS_FILTER]: setFilter,
  [actions.ADD_MOVEMENT_BY_KEY]: addMovementByKey,
  [actions.MOVEMENT_BY_KEY_UNAVAILABLE]: movementByKeyUnavailable,
  [actions.MOVEMENT_BY_KEY_FORBIDDEN]: movementByKeyForbidden,
  [actions.CLEAR_MOVEMENTS_BY_KEY]: clearMovementsByKey,
  [actions.SET_ASSOCIATED_MOVEMENT]: setAssociatedMovement,
  [actions.CLEAR_ASSOCIATED_MOVEMENTS]: clearAssociatedMovements,
  [actions.SAVE_MOVEMENT_SUCCESS]: saveMovementSuccess,
  [WIZARD_FINISH]: clearLastSaved,
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
  lastSaved: null,
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
