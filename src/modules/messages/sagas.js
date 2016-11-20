import { takeEvery } from 'redux-saga';
import { call, put, fork, select } from 'redux-saga/effects'
import { getFormValues } from 'redux-form'
import { push } from 'react-router-redux'
import * as actions from './actions';
import * as remote from './remote';

export const messagesSelector = state => state.messages;

export function* loadMessages() {
  const messages = yield select(messagesSelector);
  if (messages.loading !== true) {
    yield put(actions.setMessagesLoading());
    const snapshot = yield call(remote.loadAll);
    yield put(actions.messagesLoaded(snapshot));
  }
}

export function* saveMessage() {
  const values = yield select(getFormValues('message'));
  try {
    yield call(remote.save, values);
    yield put(actions.saveMessageSuccess())
  } catch(e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to save message', e);
    }
    yield put(actions.saveMessageFailure())
  }
}

export function* confirmSaveMessageSuccess() {
  yield put(push('/'));
  yield put(actions.resetMessageForm())
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.LOAD_MESSAGES, loadMessages),
    fork(takeEvery, actions.SAVE_MESSAGE, saveMessage),
    fork(takeEvery, actions.CONFIRM_SAVE_MESSAGE_SUCCESS, confirmSaveMessageSuccess),
  ]
}
