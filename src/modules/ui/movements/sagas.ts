import {all, takeEvery} from 'redux-saga/effects'
import {history} from '../../../history'
import * as actions from './actions';

export function* showMovementWizard(action: any) {
  const {movementType, key} = action.payload;
  history.push(`/${movementType}/${key}`);
}

export function* createMovementFromMovement(action: any) {
  const {sourceMovementType, sourceMovementKey} = action.payload;
  const targetMovementType = sourceMovementType === 'departure' ? 'arrival' : 'departure';
  history.push(`/${targetMovementType}/new/${sourceMovementKey}`);
}

export function* cancelWizard() {
  history.goBack();
}

export default function* sagas() {
  yield all([
    takeEvery(actions.SHOW_MOVEMENT_WIZARD, showMovementWizard),
    takeEvery(actions.CREATE_MOVEMENT_FROM_MOVEMENT, createMovementFromMovement),
    takeEvery(actions.CANCEL_WIZARD, cancelWizard),
  ])
}
