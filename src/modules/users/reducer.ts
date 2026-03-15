import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import { UsersAction } from './actions';
import reducer from '../../util/reducer';

interface UsersState {
  data: InstanceType<typeof ImmutableItemsArray>;
  loading: boolean;
}

function usersLoaded(state: UsersState, action: UsersAction & { type: typeof actions.USERS_LOADED }) {
  const snapshot = action.payload.snapshot as any;

  const users: any[] = [];

  snapshot.forEach((item: any) => {
    const user = item.val();
    users.unshift(user);
  });

  return Object.assign({}, state, {
    data: new ImmutableItemsArray(users),
    loading: false,
  });
}

function setLoading(state: UsersState) {
  return Object.assign({}, state, {
    loading: true,
  });
}

const ACTION_HANDLERS = {
  [actions.USERS_LOADED]: usersLoaded,
  [actions.SET_USERS_LOADING]: setLoading,
};

const INITIAL_STATE: UsersState = {
  data: new ImmutableItemsArray([]),
  loading: false,
};

export type { UsersState };
export default reducer<UsersState, UsersAction>(INITIAL_STATE, ACTION_HANDLERS);
