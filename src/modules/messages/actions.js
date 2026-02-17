export const LOAD_MESSAGES = 'LOAD_MESSAGES';
export const SET_MESSAGES_LOADING = 'SET_MESSAGES_LOADING';
export const MESSAGES_LOADED = 'MESSAGES_LOADED';
export const SELECT_MESSAGE = 'SELECT_MESSAGE';
export const SAVE_MESSAGE = 'SAVE_MESSAGE';
export const SAVE_MESSAGE_SUCCESS = 'SAVE_MESSAGE_SUCCESS';
export const SAVE_MESSAGE_FAILURE = 'SAVE_MESSAGE_FAILURE';
export const RESET_MESSAGE_FORM = 'RESET_MESSAGE_FORM';
export const CONFIRM_SAVE_MESSAGE_SUCCESS = 'CONFIRM_SAVE_MESSAGE_SUCCESS';

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

export function messagesLoaded(snapshot) {
  return {
    type: MESSAGES_LOADED,
    payload: {
      snapshot,
    },
  };
}

export function selectMessage(key) {
  return {
    type: SELECT_MESSAGE,
    payload: {
      key,
    },
  };
}

export function saveMessage(values) {
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
