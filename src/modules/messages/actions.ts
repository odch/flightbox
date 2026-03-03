export const LOAD_MESSAGES = 'LOAD_MESSAGES' as const;
export const SET_MESSAGES_LOADING = 'SET_MESSAGES_LOADING' as const;
export const MESSAGES_LOADED = 'MESSAGES_LOADED' as const;
export const SELECT_MESSAGE = 'SELECT_MESSAGE' as const;
export const SAVE_MESSAGE = 'SAVE_MESSAGE' as const;
export const SAVE_MESSAGE_SUCCESS = 'SAVE_MESSAGE_SUCCESS' as const;
export const SAVE_MESSAGE_FAILURE = 'SAVE_MESSAGE_FAILURE' as const;
export const RESET_MESSAGE_FORM = 'RESET_MESSAGE_FORM' as const;
export const CONFIRM_SAVE_MESSAGE_SUCCESS = 'CONFIRM_SAVE_MESSAGE_SUCCESS' as const;

export type MessagesAction =
  | { type: typeof LOAD_MESSAGES }
  | { type: typeof SET_MESSAGES_LOADING }
  | { type: typeof MESSAGES_LOADED; payload: { snapshot: unknown } }
  | { type: typeof SELECT_MESSAGE; payload: { key: string } }
  | { type: typeof SAVE_MESSAGE; payload: { values: unknown } }
  | { type: typeof SAVE_MESSAGE_SUCCESS }
  | { type: typeof SAVE_MESSAGE_FAILURE }
  | { type: typeof RESET_MESSAGE_FORM }
  | { type: typeof CONFIRM_SAVE_MESSAGE_SUCCESS };

export function loadMessages() {
  return {
    type: LOAD_MESSAGES,
  };
}

export function setMessagesLoading() {
  return {
    type: SET_MESSAGES_LOADING,
  };
}

export function messagesLoaded(snapshot: unknown) {
  return {
    type: MESSAGES_LOADED,
    payload: {
      snapshot,
    },
  };
}

export function selectMessage(key: string) {
  return {
    type: SELECT_MESSAGE,
    payload: {
      key,
    },
  };
}

export function saveMessage(values: unknown) {
  return {
    type: SAVE_MESSAGE,
    payload: {
      values
    }
  };
}

export function saveMessageSuccess() {
  return {
    type: SAVE_MESSAGE_SUCCESS,
  };
}

export function saveMessageFailure() {
  return {
    type: SAVE_MESSAGE_FAILURE,
  };
}

export function resetMessageForm() {
  return {
    type: RESET_MESSAGE_FORM,
  };
}

export function confirmSaveMessageSuccess() {
  return {
    type: CONFIRM_SAVE_MESSAGE_SUCCESS,
  };
}
