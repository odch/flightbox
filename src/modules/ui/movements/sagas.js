import {all, put, takeEvery} from 'redux-saga/effects'
import {goBack, push} from 'connected-react-router'
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
  yield all([
    takeEvery(actions.SHOW_MOVEMENT_WIZARD, showMovementWizard),
    takeEvery(actions.CREATE_MOVEMENT_FROM_MOVEMENT, createMovementFromMovement),
    takeEvery(actions.CANCEL_WIZARD, cancelWizard),
  ])
}
