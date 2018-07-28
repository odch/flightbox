import { getPagination } from './pagination';
import { takeEvery, takeLatest } from 'redux-saga'
import { put, call, select, fork } from 'redux-saga/effects'
import { initialize, destroy, getFormValues } from 'redux-form'
import createChannel, { monitor } from '../../util/createChannel';
import * as actions from './actions';
import * as remote from './remote';
import { localToFirebase, firebaseToLocal, transferValues } from '../../util/movements';
import { error } from '../../util/log';
import dates from '../../util/dates';

export const stateSelector = (state, key) => state.movements;

export const movementSelector = (state, key) => state.movements.data.getByKey(key);

export const wizardFormValuesSelector = getFormValues('wizard');

export function* getDepartureDefaultValues() {
  return {
    type: 'departure',
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'up'),
  };
}

export function* getArrivalDefaultValues() {
  return {
    type: 'arrival',
    date: dates.localDate(),
    time: dates.localTimeRounded(15, 'down'),
  };
}

export function* getDefaultValuesFromArrival(arrivalKey) {
  const snapshot = yield call(remote.loadByKey, '/arrivals', arrivalKey);

  const initialValues = yield call(getDepartureDefaultValues);

  const val = snapshot.val();
  if (val) {
    const arrival = firebaseToLocal(val);
    transferValues(arrival, initialValues, [
      'immatriculation',
      'aircraftType',
      'mtow',
      'memberNr',
      'lastname',
      'firstname',
      'phone',
      { name: 'passengerCount', defaultValue: 0 },
      'location',
      'flightType',
    ]);
  }

  return initialValues;
}

export function* getDefaultValuesFromDeparture(departureKey) {
  const snapshot = yield call(remote.loadByKey, '/departures', departureKey);

  const initialValues = yield call(getArrivalDefaultValues);

  const val = snapshot.val();
  if (val) {
    const departure = firebaseToLocal(val);
    transferValues(departure, initialValues, [
      'immatriculation',
      'aircraftType',
      'mtow',
      'memberNr',
      'lastname',
      'firstname',
      'phone',
      { name: 'passengerCount', defaultValue: 0 },
      'location',
      'flightType',
    ]);

    if (departure.departureRoute === 'circuits') {
      initialValues.arrivalRoute = 'circuits';
    }
  }

  return initialValues;
}

export function getOldest(snapshot) {
  let oldest = null;
  snapshot.forEach(item => {
    const val = item.val();
    if (!oldest || oldest.negativeTimestamp < val.negativeTimestamp) {
      oldest = val
    }
  });
  return oldest;
}

export function* loadMovements(channel, action) {
  try {
    const {clear} = action.payload;

    const movements = yield select(stateSelector);
    if (movements.loading !== true) {
      yield put(actions.setMovementsLoading());

      const pagination = getPagination(clear ? [] : movements.data.array);

      const departures = yield call(
        remote.loadLimited,
        '/departures',
        pagination.start,
        pagination.limit
      );

      const oldestDeparture = getOldest(departures.snapshot);

      let arrivalsLimit = null;
      let arrivalsEnd = null;

      if (oldestDeparture) {
        arrivalsEnd = oldestDeparture.negativeTimestamp;
      } else {
        arrivalsLimit = pagination.limit;
      }

      const arrivals = yield call(
        remote.loadLimited,
        '/arrivals',
        pagination.start,
        arrivalsLimit,
        arrivalsEnd
      );

      yield call(monitorRef, departures.ref, channel, 'departure');
      yield call(monitorRef, arrivals.ref, channel, 'arrival');

      channel.put(actions.movementsAdded(departures.snapshot, 'departure', clear));
      channel.put(actions.movementsAdded(arrivals.snapshot, 'arrival', clear));
    }
  } catch(e) {
    error('Failed to load movements', e);
    channel.put(actions.loadMovementsFailure());
  }
}

export function* monitorRef(ref, channel, movementType) {
  ref.off('child_added');
  ref.off('child_changed');
  ref.off('child_removed');

  const childAdded = createDelegate(channel, actions.movementAdded, movementType);
  const childChanged = createDelegate(channel, actions.movementChanged, movementType);
  const childRemoved = createDelegate(channel, actions.movementDeleted, movementType);

  ref.on('child_added', childAdded);
  ref.on('child_changed', childChanged);
  ref.on('child_removed', childRemoved);
}

export function createDelegate(channel, action, movementType) {
  return snapshot => channel.put(action(snapshot, movementType))
}

export function* deleteMovement(action) {
  const {movementType, key, successAction} = action.payload;
  yield call(remote.removeMovement, getPathByMovementType(movementType), key);
  yield put(successAction());
}

export function* initNewMovement(action) {
  const {movementType} = action.payload;
  const loadInitialValuesSaga = movementType === 'departure'
    ? getDepartureDefaultValues
    : getArrivalDefaultValues;
  yield call(initMovement, loadInitialValuesSaga);
}

export function* initNewMovementFromMovement(action) {
  const {movementType, sourceMovementKey} = action.payload;
  const loadInitialValuesSaga = movementType === 'departure'
    ? getDefaultValuesFromArrival
    : getDefaultValuesFromDeparture;
  yield call(initMovement, loadInitialValuesSaga, sourceMovementKey);
}

export function* initMovement(loadInitialValuesSaga, ...loadInitialValuesArgs) {
  yield put(actions.startInitializeWizard());
  yield put(destroy('wizard'));
  const initialValues = yield call(loadInitialValuesSaga, ...loadInitialValuesArgs);
  yield put(initialize('wizard', initialValues));
  yield put(actions.wizardInitialized());
}

export function* editMovement(action) {
  const {movementType, key} = action.payload;
  yield put(actions.startInitializeWizard());
  yield put(destroy('wizard'));
  let movement = yield(select(movementSelector, key));
  if (!movement) {
    const path = getPathByMovementType(movementType);
    const snapshot = yield(call(remote.loadByKey, path, key));
    movement = firebaseToLocal(snapshot.val());
    movement.key = snapshot.key;
    movement.type = movementType;
  }
  yield put(initialize('wizard', movement));
  yield put(actions.wizardInitialized());
}

export function* saveMovement() {
  const values = yield select(wizardFormValuesSelector);

  const movement = localToFirebase(values);

  const path = getPathByMovementType(movement.type);

  let key = movement.key;
  delete movement.key;

  delete movement.type;
  delete movement.associations;

  try {
    key = yield call(remote.saveMovement, path, key, movement);
    yield put(actions.saveMovementSuccess(key, values))
  } catch(e) {
    if (console && typeof console.error === 'function') {
      console.error('Failed to save movement', e);
      console.error('movement', movement);
    }
    yield put(actions.saveMovementFailed(e))
  }
}

function getPathByMovementType(type) {
  switch(type) {
    case 'departure':
      return '/departures';
    case 'arrival':
      return '/arrivals';
    default:
      throw new Error('Unknown movement type ' + type);
  }
}

export default function* sagas() {
  const channel = createChannel();

  yield [
    fork(monitor, channel),
    fork(takeEvery, actions.LOAD_MOVEMENTS, loadMovements, channel),
    fork(takeEvery, actions.DELETE_MOVEMENT, deleteMovement),
    fork(takeEvery, actions.INIT_NEW_MOVEMENT, initNewMovement),
    fork(takeEvery, actions.INIT_NEW_MOVEMENT_FROM_MOVEMENT, initNewMovementFromMovement),
    fork(takeEvery, actions.SAVE_MOVEMENT, saveMovement),
    fork(takeLatest, actions.EDIT_MOVEMENT, editMovement),
  ]
}
