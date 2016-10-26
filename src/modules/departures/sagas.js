import { takeEvery, takeLatest } from 'redux-saga';
import { call, put, fork, select } from 'redux-saga/effects'
import { initialize, getFormValues, destroy } from 'redux-form'
import * as actions from './actions';
import dates from '../../core/dates.js';
import firebase from '../../util/firebase';
import * as selectors from '../selectors';
import { localToFirebase, firebaseToLocal } from '../../util/movements';

export function saveMovement(movement) {
  return new Promise((resolve, reject) => {
    let key;

    const setCommitted = error => {
      if (error) {
        reject(error);
      } else {
        resolve(key);
      }
    };

    if (movement.key) {
      key = movement.key;
      delete movement.key;
      firebase('/departures').child(key).set(movement, setCommitted);
    } else {
      key = firebase('/departures').push(movement, setCommitted).key();
    }
  });
}

export function loadDeparture(key) {
  return new Promise(resolve => {
    firebase('/departures').child(key).once('value', snapshot => {
      const departure = firebaseToLocal(snapshot.val());
      departure.key = snapshot.key();
      resolve(departure)
    })
  });
}

export function* initNewDeparture() {
  yield put(destroy('wizard'));
  yield put(initialize('wizard', {
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'up'),
  }));
}

export function* editDeparture(action) {
  yield put(destroy('wizard'));
  let departure = yield(select(selectors.departure(action.payload.key)));
  if (!departure) {
    departure = yield(call(loadDeparture, action.payload.key))
  }
  yield put(initialize('wizard', departure));
}

export function* saveDeparture() {
  const values = yield select(getFormValues('wizard'));
  const movement = localToFirebase(values);
  const key = yield call(saveMovement, movement);
  yield put(actions.saveDepartureSuccess(key))
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.INIT_NEW_DEPARTURE, initNewDeparture),
    fork(takeEvery, actions.SAVE_DEPARTURE, saveDeparture),
    fork(takeLatest, actions.EDIT_DEPARTURE, editDeparture),
  ]
}
