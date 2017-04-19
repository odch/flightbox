import { getPagination } from './pagination';
import { put, call, select } from 'redux-saga/effects'
import { initialize, destroy, getFormValues } from 'redux-form'
import * as actions from './actions';
import * as remote from './remote';
import { localToFirebase, firebaseToLocal } from '../../../util/movements';
import { error } from '../../../util/log';

export function* loadMovements(setLoadingAction, failureAction, stateSelector, firebasePath, channel, successAction,
                               childAddedAction, childChangedAction, childRemovedAction) {
  try {
    const movements = yield select(stateSelector);
    if (movements.loading !== true) {
      yield put(setLoadingAction());

      const pagination = getPagination(movements.data.array);

      const result = yield call(
        remote.loadLimited,
        firebasePath,
        pagination.start,
        pagination.limit
      );

      const childAdded = snapshot => channel.put(childAddedAction(snapshot));
      const childChanged = snapshot => channel.put(childChangedAction(snapshot));
      const childRemoved = snapshot => channel.put(childRemovedAction(snapshot));

      yield call(monitorRef, result.ref, childAdded, childChanged, childRemoved);

      channel.put(successAction(result.snapshot, result.ref));
    }
  } catch(e) {
    error('Failed to load movements', e);
    channel.put(failureAction());
  }
}

export function* monitorRef(ref, childAdded, childChanged, childRemoved) {
  ref.off('child_added');
  ref.off('child_changed');
  ref.off('child_removed');

  ref.on('child_added', childAdded);
  ref.on('child_changed', childChanged);
  ref.on('child_removed', childRemoved);
}

export function* monitorMovements(stateSelector, channel, childAddedAction, childChangedAction, childRemovedAction) {
  const state = yield select(stateSelector);

  const childAdded = snapshot => channel.put(childAddedAction(snapshot));
  const childChanged = snapshot => channel.put(childChangedAction(snapshot));
  const childRemoved = snapshot => channel.put(childRemovedAction(snapshot));

  for (const ref of state.refs) {
    yield call(monitorRef, ref, childAdded, childChanged, childRemoved);
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

export function* saveMovement(path, successAction, failureAction) {
  const values = yield select(getFormValues('wizard'));
  const movement = localToFirebase(values);

  let key = movement.key;
  delete movement.key;

  try {
    key = yield call(remote.saveMovement, path, key, movement);
    yield put(successAction(key, values))
  } catch(e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to save movement', e);
      console.error('movement', movement);
    }
    yield put(failureAction(e))
  }
}
