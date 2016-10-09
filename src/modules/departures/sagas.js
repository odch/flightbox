import { takeEvery } from 'redux-saga';
import { call, put, fork, select } from 'redux-saga/effects'
import { getFormValues } from 'redux-form'
import * as actions from './actions';
import firebase from '../../util/firebase';
import { localToFirebase } from '../../util/movements';

export function pushMovement(movement) {
  return new Promise((resolve, reject) => {
    let key;

    const setCommitted = error => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    };

    key = firebase('/departures').push(movement, setCommitted).key();
  });
}

export function* saveDeparture() {
  const values = yield select(getFormValues('wizard'));
  const movement = localToFirebase(values);
  const key = yield call(pushMovement, movement);
  yield put(actions.saveDepartureSuccess(key))
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.SAVE_DEPARTURE, saveDeparture),
  ]
}
