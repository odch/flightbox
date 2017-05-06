import { takeEvery } from 'redux-saga';
import { put, fork } from 'redux-saga/effects'
import { push, goBack } from 'react-router-redux'
import * as actions from './actions';

export function* showMovementWizard(action) {
  const {movementType, key} = action.payload;
  yield put(push(`/${movementType}/${key}`));
}

export function* createMovementFromMovement(action) {
  const {sourceMovementType, sourceMovementKey} = action.payload;
  const targetMovementType = sourceMovementType === 'departure' ? 'arrival' : 'departure';
  yield put(push(`/${targetMovementType}/new/${sourceMovementKey}`));
}

export function* cancelWizard() {
  yield put(goBack());
}

export default function* sagas() {
  yield [
    fork(takeEvery, actions.SHOW_MOVEMENT_WIZARD, showMovementWizard),
    fork(takeEvery, actions.CREATE_MOVEMENT_FROM_MOVEMENT, createMovementFromMovement),
    fork(takeEvery, actions.CANCEL_WIZARD, cancelWizard),
  ]
}
