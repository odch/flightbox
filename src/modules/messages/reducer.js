import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import reducer from '../../util/reducer';

const INITIAL_STATE = {
  data: new ImmutableItemsArray(),
  loading: false,
  selected: null,
  form: {
    sent: false,
    commitFailed: false,
  },
};

function messagesLoaded(state, action) {
  const snapshot = action.payload.snapshot;

  const messages = [];

  snapshot.forEach(item => {
    const message = item.val();
    message.key = item.key;
    messages.unshift(message);
  });

  return Object.assign({}, state, {
    data: new ImmutableItemsArray(messages),
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

function saveMessageSuccess(state) {
  return Object.assign({}, state, {
    form: {
      sent: true,
      commitFailed: false,
    },
  });
}

function saveMessageFailure(state) {
  return Object.assign({}, state, {
    form: {
      sent: false,
      commitFailed: true,
    },
  });
}

function resetForm(state) {
  return Object.assign({}, state, {
    form: INITIAL_STATE.form,
  });
}

const ACTION_HANDLERS = {
  [actions.MESSAGES_LOADED]: messagesLoaded,
  [actions.SET_MESSAGES_LOADING]: setLoading,
  [actions.SELECT_MESSAGE]: selectMessage,
  [actions.SAVE_MESSAGE_SUCCESS]: saveMessageSuccess,
  [actions.SAVE_MESSAGE_FAILURE]: saveMessageFailure,
  [actions.RESET_MESSAGE_FORM]: resetForm,
};

export default reducer(INITIAL_STATE, ACTION_HANDLERS);
