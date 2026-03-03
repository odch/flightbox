import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import { AerodromesAction } from './actions';
import reducer from '../../util/reducer';

interface AerodromesState {
  data: InstanceType<typeof ImmutableItemsArray>;
  loading: boolean;
  selected: string | null;
}

function aerodromesLoaded(state: AerodromesState, action: AerodromesAction & { type: typeof actions.AERODROMES_LOADED }) {
  const snapshot = action.payload.snapshot as any;

  const aerodromes: any[] = [];

  snapshot.forEach((item: any) => {
    const aerodrome = item.val();
    aerodrome.key = item.key;
    aerodromes.unshift(aerodrome);
  });

  return Object.assign({}, state, {
    data: new ImmutableItemsArray(aerodromes),
    loading: false,
  });
}

function setLoading(state: AerodromesState) {
  return Object.assign({}, state, {
    loading: true,
  });
}

const ACTION_HANDLERS = {
  [actions.AERODROMES_LOADED]: aerodromesLoaded,
  [actions.SET_AERODROMES_LOADING]: setLoading,
};

const INITIAL_STATE: AerodromesState = {
  data: new ImmutableItemsArray([]),
  loading: false,
  selected: null,
};

export type { AerodromesState };
export default reducer<AerodromesState, AerodromesAction>(INITIAL_STATE, ACTION_HANDLERS);
