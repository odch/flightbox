import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import reducer from '../../util/reducer';

function messagesLoaded(state, action) {
  const snapshot = action.payload.snapshot;

  const messages = [];

  snapshot.forEach(item => {
    const message = item.val();
    message.key = item.key();
    messages.unshift(message);
  });

  return Object.assign({}, state, {
    data: state.data.insertAll(messages),
    loading: false,
  });
}

function setLoading(state) {
  return Object.assign({}, state, {
    loading: true,
  });
}

function selectMessage(state, action) {
  return Object.assign({}, state, {
    selected: action.payload.key,
  });
}

const ACTION_HANDLERS = {
  [actions.MESSAGES_LOADED]: messagesLoaded,
  [actions.SET_MESSAGES_LOADING]: setLoading,
  [actions.SELECT_MESSAGE]: selectMessage,
};

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
  selected: null,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
