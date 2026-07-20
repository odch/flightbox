import * as actions from './actions';
import { FrequentAerodromesAction } from './actions';
import { SAVE_MOVEMENT_SUCCESS } from '../movements/actions';
import reducer from '../../util/reducer';

// This reducer also reacts to the movements SAVE_MOVEMENT_SUCCESS action, so its
// action type is broader than its own action union.
type ReducerAction = FrequentAerodromesAction | { type: typeof SAVE_MOVEMENT_SUCCESS; payload: { key: string; values: unknown } };

interface FrequentAerodromesState {
  data: string[];
  loaded: boolean;
  session: string[];
}

function frequentAerodromesLoaded(
  state: FrequentAerodromesState,
  action: FrequentAerodromesAction & { type: typeof actions.FREQUENT_AERODROMES_LOADED }
) {
  return {
    ...state,
    data: action.payload.data,
    loaded: true,
  };
}

// Records the aerodrome of a just-saved movement so it shows up as a favourite
// immediately in the next movement form, without waiting for the movement list to
// reload. Most-recently-used first, de-duplicated.
function movementSaved(state: FrequentAerodromesState, action: any) {
  const values = action.payload && action.payload.values;
  const location = values && typeof values.location === 'string' ? values.location.toUpperCase() : null;
  if (!location) {
    return state;
  }
  return {
    ...state,
    session: [location, ...state.session.filter(icao => icao !== location)],
  };
}

const ACTION_HANDLERS = {
  [actions.FREQUENT_AERODROMES_LOADED]: frequentAerodromesLoaded,
  [SAVE_MOVEMENT_SUCCESS]: movementSaved,
};

const INITIAL_STATE: FrequentAerodromesState = {
  data: [],
  loaded: false,
  session: [],
};

export type { FrequentAerodromesState };
export default reducer<FrequentAerodromesState, ReducerAction>(INITIAL_STATE, ACTION_HANDLERS);
