export const LOAD_MESSAGES = 'LOAD_MESSAGES';
export const SET_MESSAGES_LOADING = 'SET_MESSAGES_LOADING';
export const MESSAGES_LOADED = 'MESSAGES_LOADED';
export const SELECT_MESSAGE = 'SELECT_MESSAGE';

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
