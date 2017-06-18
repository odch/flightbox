import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import reducer from '../../util/reducer';

function usersLoaded(state, action) {
  const snapshot = action.payload.snapshot;

  const users = [];

  snapshot.forEach(item => {
    const user = item.val();
    users.unshift(user);
  });

  return Object.assign({}, state, {
    data: new ImmutableItemsArray(users),
    loading: false,
  });
}

function setLoading(state) {
  return Object.assign({}, state, {
    loading: true,
  });
}

const ACTION_HANDLERS = {
  [actions.USERS_LOADED]: usersLoaded,
  [actions.SET_USERS_LOADING]: setLoading,
};

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
