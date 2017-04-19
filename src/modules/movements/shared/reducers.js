import { firebaseToLocal, compareDescending } from '../../../util/movements';

export default function (initialState, actionHandlers) {
  return (state = initialState, action) => {
    const handler = actionHandlers[action.type];
    if (handler) {
      return handler(state, action);
    }
    return state;
  };
}

export function childrenAdded(state, action) {
  const {snapshot, ref} = action.payload;

  const movements = [];

  snapshot.forEach(item => {
    const movement = firebaseToLocal(item.val());
    movement.key = item.key();
    movements.push(movement);
  });

  return Object.assign({}, state, {
    data: state.data.insertAll(movements, compareDescending),
    loading: false,
    refs: state.refs.concat(ref)
  });
}

export function childAdded(state, action) {
  const snapshot = action.payload.snapshot;

  const movement = firebaseToLocal(snapshot.val());
  movement.key = snapshot.key();

  return Object.assign({}, state, {
    data: state.data.insert(movement, compareDescending),
  });
}

export function childChanged(state, action) {
  const snapshot = action.payload.snapshot;

  const movement = firebaseToLocal(snapshot.val());
  movement.key = snapshot.key();

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
