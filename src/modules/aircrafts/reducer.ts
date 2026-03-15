import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import { AircraftsAction } from './actions';
import reducer from '../../util/reducer';

interface AircraftsState {
  data: InstanceType<typeof ImmutableItemsArray>;
  loading: boolean;
  selected: string | null;
}

function aircraftsLoaded(state: AircraftsState, action: AircraftsAction & { type: typeof actions.AIRCRAFTS_LOADED }) {
  const snapshot = action.payload.snapshot as any;

  const aircrafts: any[] = [];

  snapshot.forEach((item: any) => {
    const aircraft = item.val();
    aircraft.key = item.key;
    aircrafts.unshift(aircraft);
  });

  return Object.assign({}, state, {
    data: new ImmutableItemsArray(aircrafts),
    loading: false,
  });
}

function setLoading(state: AircraftsState) {
  return Object.assign({}, state, {
    loading: true,
  });
}

const ACTION_HANDLERS = {
  [actions.AIRCRAFTS_LOADED]: aircraftsLoaded,
  [actions.SET_AIRCRAFTS_LOADING]: setLoading,
};

const INITIAL_STATE: AircraftsState = {
  data: new ImmutableItemsArray([]),
  loading: false,
  selected: null,
};

export type { AircraftsState };
export default reducer<AircraftsState, AircraftsAction>(INITIAL_STATE, ACTION_HANDLERS);
