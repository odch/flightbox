import ImmutableItemsArray from '../../util/ImmutableItemsArray';
import * as actions from './actions';
import { MessagesAction } from './actions';
import reducer from '../../util/reducer';

interface MessagesFormState {
  sent: boolean;
  commitFailed: boolean;
}

interface MessagesState {
  data: InstanceType<typeof ImmutableItemsArray>;
  loading: boolean;
  selected: string | null;
  form: MessagesFormState;
}

const INITIAL_STATE: MessagesState = {
  data: new ImmutableItemsArray([]),
  loading: false,
  selected: null,
  form: {
    sent: false,
    commitFailed: false,
  },
};

function messagesLoaded(state: MessagesState, action: MessagesAction & { type: typeof actions.MESSAGES_LOADED }) {
  const snapshot = action.payload.snapshot as any;

  const messages: any[] = [];

  snapshot.forEach((item: any) => {
    const message = item.val();
    message.key = item.key;
    messages.unshift(message);
  });

  return Object.assign({}, state, {
    data: new ImmutableItemsArray(messages),
    loading: false,
  });
}

function setLoading(state: MessagesState) {
  return Object.assign({}, state, {
    loading: true,
  });
}

function selectMessage(state: MessagesState, action: MessagesAction & { type: typeof actions.SELECT_MESSAGE }) {
  return Object.assign({}, state, {
    selected: action.payload.key,
  });
}

function saveMessageSuccess(state: MessagesState) {
  return Object.assign({}, state, {
    form: {
      sent: true,
      commitFailed: false,
    },
  });
}

function saveMessageFailure(state: MessagesState) {
  return Object.assign({}, state, {
    form: {
      sent: false,
      commitFailed: true,
    },
  });
}

function resetForm(state: MessagesState) {
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

export type { MessagesState };
export default reducer<MessagesState, MessagesAction>(INITIAL_STATE, ACTION_HANDLERS);
