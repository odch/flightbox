import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import { firebaseToLocal, compareDescending } from '../../util/movements';
import associate from './associate';

export function childrenAdded(state, action) {
  const {snapshot, movementType, clear} = action.payload;

  const movements = [];

  snapshot.forEach(item => {
    const movement = firebaseToLocal(item.val());
    movement.key = item.key;
    movement.type = movementType;
    movements.push(movement);
  });

  const existingMovements = clear ? new ImmutableItemsArray() : state.data;

  let newData = existingMovements.insertAll(movements, compareDescending);
  newData = associate(newData, compareDescending);

  return Object.assign({}, state, {
    data: newData,
    loading: false
  });
}

export function childAdded(state, action) {
  const {snapshot, movementType} = action.payload;

  const movement = firebaseToLocal(snapshot.val());
  movement.key = snapshot.key;
  movement.type = movementType;

  let newData = state.data.insert(movement, compareDescending);
  newData = associate(newData, compareDescending);

  return Object.assign({}, state, {
    data: newData
  });
}

export function childChanged(state, action) {
  const {snapshot, movementType} = action.payload;

  const movement = firebaseToLocal(snapshot.val());
  movement.key = snapshot.key;
  movement.type = movementType;

  let newData = state.data.update(movement, compareDescending);
  newData = associate(newData, compareDescending);

  return Object.assign({}, state, {
    data: newData
  });
}

export function childRemoved(state, action) {
  const snapshot = action.payload.snapshot;

  let newData = state.data.remove(snapshot.key);
  newData = associate(newData, compareDescending);

  return Object.assign({}, state, {
    data: newData
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

const ACTION_HANDLERS = {
  [actions.MOVEMENTS_ADDED]: childrenAdded,
  [actions.MOVEMENT_ADDED]: childAdded,
  [actions.MOVEMENT_CHANGED]: childChanged,
  [actions.MOVEMENT_DELETED]: childRemoved,
  [actions.SET_MOVEMENTS_LOADING]: setLoading,
  [actions.LOAD_MOVEMENTS_FAILURE]: setLoadingFailure,
};

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
  loadingFailed: false
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
