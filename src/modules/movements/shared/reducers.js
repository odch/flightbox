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
  const snapshot = action.payload.snapshot;

  const movements = [];

  snapshot.forEach(item => {
    const movement = firebaseToLocal(item.val());
    movement.key = item.key();
    movements.push(movement);
  });

  return Object.assign({}, state, {
    data: state.data.insertAll(movements, compareDescending),
    loading: false,
  });
}

export function setLoading(state) {
  return Object.assign({}, state, {
    loading: true,
  });
}
