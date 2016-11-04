import { getPagination } from './pagination';
import { put, call, select } from 'redux-saga/effects'
import { initialize, destroy, getFormValues } from 'redux-form'
import * as actions from './actions';
import * as remote from './remote';
import { localToFirebase, firebaseToLocal } from '../../../util/movements';

export function* loadMovements(setLoadingAction, stateSelector, firebasePath, channel, successAction) {
  const movements = yield select(stateSelector);
  if (movements.loading !== true) {
    yield put(setLoadingAction());
    const pagination = getPagination(movements.data.array);
    const snapshot = yield call(remote.loadLimited, firebasePath, pagination.start, pagination.limit);
    channel.put(successAction(snapshot));
  }
}

export function* deleteMovement(path, key, successAction) {
  yield call(remote.removeMovement, path, key);
  yield put(successAction());
}

export function* initNewMovement(loadInitialValues, ...loadInitialValuesArgs) {
  yield put(actions.startInitializeWizard());
  yield put(destroy('wizard'));
  const initialValues = yield call(loadInitialValues, ...loadInitialValuesArgs);
  yield put(initialize('wizard', initialValues));
  yield put(actions.wizardInitialized());
}

export function* editMovement(path, movementSelector, key) {
  yield put(actions.startInitializeWizard());
  yield put(destroy('wizard'));
  let movement = yield(select(movementSelector, key));
  if (!movement) {
    const snapshot = yield(call(remote.loadByKey, path, key));
    movement = firebaseToLocal(snapshot.val());
    movement.key = snapshot.key();
  }
  yield put(initialize('wizard', movement));
  yield put(actions.wizardInitialized());
}

export function* saveMovement(path, successAction) {
  const values = yield select(getFormValues('wizard'));
  const movement = localToFirebase(values);

  let key = movement.key;
  delete movement.key;

  key = yield call(remote.saveMovement, path, key, movement);

  yield put(successAction(key, values))
}
