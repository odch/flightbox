import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import { firebaseToLocal, compareDescending } from '../../util/movements';

export function childrenAdded(state, action) {
  const {snapshot, ref, movementType} = action.payload;

  const movements = [];

  snapshot.forEach(item => {
    const movement = firebaseToLocal(item.val());
    movement.key = item.key();
    movement.type = movementType;
    movements.push(movement);
  });

  return Object.assign({}, state, {
    data: state.data.insertAll(movements, compareDescending),
    loading: false,
    refs: state.refs.concat({
      type: movementType,
      ref
    })
  });
}

export function childAdded(state, action) {
  const {snapshot, movementType} = action.payload;

  const movement = firebaseToLocal(snapshot.val());
  movement.key = snapshot.key();
  movement.type = movementType;

  return Object.assign({}, state, {
    data: state.data.insert(movement, compareDescending),
  });
}

export function childChanged(state, action) {
  const {snapshot, movementType} = action.payload;

  const movement = firebaseToLocal(snapshot.val());
  movement.key = snapshot.key();
  movement.type = movementType;

  return Object.assign({}, state, {
    data: state.data.update(movement, compareDescending),
  });
}

export function childRemoved(state, action) {
  const snapshot = action.payload.snapshot;

  return Object.assign({}, state, {
    data: state.data.remove(snapshot.key()),
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
  loadingFailed: false,
  refs: []
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
