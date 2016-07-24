import { takeEvery } from 'redux-saga';
import { call, put, fork, select } from 'redux-saga/effects'
import * as actions from './actions';
import firebase from '../../util/firebase';

export function loadAll() {
  return new Promise(resolve => {
    const ref = firebase('/messages');
    ref.orderByKey().once('value', snapshot => {
      resolve(snapshot);
    });
  });
}

export function* loadMessages() {
  const messages = yield select(state => state.messages);
  if (messages.loading !== true) {
    yield put(actions.setMessagesLoading());
    const snapshot = yield call(loadAll);
    yield put(actions.messagesLoaded(snapshot));
  }
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.LOAD_MESSAGES, loadMessages),
  ]
}
