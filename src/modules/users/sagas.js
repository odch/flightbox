import {all, call, put, select, takeEvery} from 'redux-saga/effects'
import * as actions from './actions';
import firebase from '../../util/firebase';

export const usersSelector = state => state.users;

export function loadAll() {
  return new Promise(resolve => {
    const ref = firebase('/users');
    ref.orderByKey().once('value', snapshot => {
      resolve(snapshot);
    });
  });
}

export function* loadUsers() {
  const users = yield select(usersSelector);
  if (users.loading !== true) {
    yield put(actions.setUsersLoading());
    const snapshot = yield call(loadAll);
    yield put(actions.usersLoaded(snapshot));
  }
}

export default function* sagas() {
  yield all([
    takeEvery(actions.LOAD_USERS, loadUsers),
  ])
}
